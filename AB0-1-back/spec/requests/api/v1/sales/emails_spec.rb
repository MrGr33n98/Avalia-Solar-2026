# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales API - Emails', type: :request do
  let(:company) do
    Company.new(name: 'Empresa Teste', slug: 'empresa-teste-1').tap { |c| c.save!(validate: false) }
  end
  let(:other_company) do
    Company.new(name: 'Outra Empresa', slug: 'outra-empresa-2').tap { |c| c.save!(validate: false) }
  end

  let(:user) do
    User.new(
      name: 'Sales User',
      email: 'sales.user@avaliasolar.com.br',
      password: 'Password123!',
      role: 'admin',
      company_id: company.id,
      terms_accepted: true
    ).tap { |u| u.save!(validate: false) }
  end

  let(:headers) do
    token = JWT.encode({ user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i }, Rails.application.secret_key_base)
    {
      'Authorization' => "Bearer #{token}",
      'CONTENT_TYPE' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  let(:account) { Sales::Account.create!(company_id: company.id, name: 'Conta Teste', owner: user) }
  let(:contact) { Sales::Contact.create!(account: account, first_name: 'João', last_name: 'Silva', email: 'joao@cliente.com') }

  let(:other_account) { Sales::Account.create!(company_id: other_company.id, name: 'Outra Conta', owner: user) }

  describe 'GET /api/v1/sales/emails' do
    it 'retorna status 200 com metadados de paginação' do
      get '/api/v1/sales/emails?page=1&per_page=10', headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to have_key('emails')
      expect(json).to have_key('meta')
      expect(json['meta']['page']).to eq(1)
      expect(json['meta']['per_page']).to eq(10)
    end

    it 'inclui e-mails manuais sem conta no resultado' do
      thread = Sales::EmailThread.create!(company_id: company.id, subject_normalized: 'teste manual', first_message_at: Time.current, last_message_at: Time.current)
      email = Sales::EmailMessage.create!(
        company_id: company.id,
        sales_email_thread_id: thread.id,
        sender_user_id: user.id,
        from_email: user.email,
        to_email: 'manual@cliente.com',
        subject: 'Email Manual',
        body_text: 'Mensagem',
        status: 'sent'
      )

      get '/api/v1/sales/emails', headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      email_ids = json['emails'].map { |e| e['id'] }
      expect(email_ids).to include(email.id)
    end
  end

  describe 'POST /api/v1/sales/emails' do
    before { allow(Sales::Messaging::SendingGate).to receive(:enabled?).and_return(true) }

    context 'Com conta e contato' do
      it 'cria e-mail e enfileira job retornando 201 Created' do
        payload = {
          email: {
            sales_account_id: account.id,
            sales_contact_id: contact.id,
            subject: 'Proposta Comercial',
            body_text: 'Corpo da mensagem'
          }
        }

        expect {
          post '/api/v1/sales/emails', params: payload.to_json, headers: headers
        }.to change(Sales::EmailMessage, :count).by(1)
         .and have_enqueued_job(Sales::SendEmailJob)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['email']['subject']).to eq('Proposta Comercial')
        expect(json['email']['account_id']).to eq(account.id)
        expect(json['email']['contact_id']).to eq(contact.id)
      end
    end

    context 'Outbound manual (apenas to_email)' do
      it 'cria e-mail manual sem conta e enfileira job' do
        payload = {
          email: {
            to_email: 'manual.outbound@cliente.com',
            subject: 'Contato Direto',
            body_text: 'Corpo do e-mail manual'
          }
        }

        expect {
          post '/api/v1/sales/emails', params: payload.to_json, headers: headers
        }.to change(Sales::EmailMessage, :count).by(1)
         .and have_enqueued_job(Sales::SendEmailJob)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['email']['to_email']).to eq('manual.outbound@cliente.com')
        expect(json['email']['account_id']).to be_nil
        expect(json['email']['contact_id']).to be_nil
      end
    end

    context 'Validações' do
      it 'bloqueia envio sem criar registro quando a kill switch está desligada' do
        allow(Sales::Messaging::SendingGate).to receive(:enabled?).and_return(false)
        payload = { email: { to_email: 'prospect@example.test', subject: 'Teste', body_text: 'Olá' } }

        expect {
          post '/api/v1/sales/emails', params: payload.to_json, headers: headers
        }.not_to change(Sales::EmailMessage, :count)

        expect(response).to have_http_status(:service_unavailable)
        expect(JSON.parse(response.body)['code']).to eq('EMAIL_SENDING_DISABLED')
      end

      it 'retorna 422 EMAIL_RECIPIENT_REQUIRED se destinatário for ausente' do
        payload = {
          email: {
            subject: 'Sem destinatário',
            body_text: 'Texto'
          }
        }

        post '/api/v1/sales/emails', params: payload.to_json, headers: headers

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['code']).to eq('EMAIL_RECIPIENT_REQUIRED')
      end

      it 'retorna 422 INVALID_EMAIL_ADDRESS se e-mail for inválido' do
        payload = {
          email: {
            to_email: 'email_invalido_sem_arrouba',
            subject: 'Formato inválido',
            body_text: 'Texto'
          }
        }

        post '/api/v1/sales/emails', params: payload.to_json, headers: headers

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['code']).to eq('INVALID_EMAIL_ADDRESS')
      end

      it 'rejeita IDs de outra empresa (tenant isolation)' do
        payload = {
          email: {
            sales_account_id: other_account.id,
            subject: 'Cross Tenant',
            body_text: 'Texto'
          }
        }

        role = Sales::Role.create!(name: 'Email Sales', slug: "email_sales_#{SecureRandom.hex(4)}", system: true)
        Sales::UserRole.create!(user: user, role: role)
        user.update_column(:role, 'company')

        post '/api/v1/sales/emails', params: payload.to_json, headers: headers

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'GET /api/v1/sales/emails/:id' do
    let(:thread) do
      Sales::EmailThread.create!(company_id: company.id, subject_normalized: 'detalhe email', first_message_at: Time.current, last_message_at: Time.current)
    end
    let(:email) do
      Sales::EmailMessage.create!(
        company_id: company.id,
        sales_email_thread_id: thread.id,
        sales_account_id: account.id,
        sales_contact_id: contact.id,
        sender_user_id: user.id,
        from_email: user.email,
        to_email: contact.email,
        subject: 'Email com eventos',
        body_text: 'Corpo do email detalhado',
        body_html: '<p>Corpo do email detalhado</p>',
        status: 'delivered',
        delivery_status: 'delivered',
        engagement_status: 'open_signal'
      )
    end

    it 'retorna detalhes completos incluindo eventos reais e contadores de engajamento' do
      email.events.create!(
        company_id: company.id,
        event_type: 'delivered',
        source: 'aws_ses_sns',
        occurred_at: 10.minutes.ago
      )
      email.events.create!(
        company_id: company.id,
        event_type: 'open_signal',
        source: 'avalia_pixel',
        signal_class: 'proxy',
        occurred_at: 5.minutes.ago
      )

      get "/api/v1/sales/emails/#{email.id}", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      data = json['email']
      expect(data['id']).to eq(email.id)
      expect(data['body_text']).to eq('Corpo do email detalhado')
      expect(data['body_html']).to eq('<p>Corpo do email detalhado</p>')
      expect(data['delivery_status']).to eq('delivered')
      expect(data['engagement_status']).to eq('open_signal')
      expect(data['engagement']).to be_a(Hash)
      expect(data['events'].length).to eq(2)
      expect(data['events'].map { |e| e['event_type'] }).to eq(%w[delivered open_signal])
      expect(data['events'].map { |e| e['signal_class'] }).to eq([nil, 'proxy'])
    end

    it 'impede acesso a e-mail de outra empresa (tenant isolation)' do
      other_thread = Sales::EmailThread.create!(company_id: other_company.id, subject_normalized: 'outro', first_message_at: Time.current, last_message_at: Time.current)
      other_email = Sales::EmailMessage.create!(
        company_id: other_company.id,
        sales_email_thread_id: other_thread.id,
        sender_user_id: user.id,
        from_email: 'outro@empresa.com',
        to_email: 'dest@empresa.com',
        subject: 'Outro',
        body_text: 'Outro'
      )

      get "/api/v1/sales/emails/#{other_email.id}", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end
end
