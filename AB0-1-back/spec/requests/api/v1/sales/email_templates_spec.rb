# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales Email Templates API', type: :request do
  let!(:company) { create(:company) }
  let!(:other_company) { create(:company) }
  let!(:user) { create(:user, company: company) }
  let!(:other_user) { create(:user, company: other_company) }

  let!(:template1) do
    ::Sales::EmailTemplate.create!(
      company: company,
      name: 'Proposta Comercial',
      subject_template: 'Sua proposta de energia solar {{person.first_name}}',
      preheader: 'Confira os detalhes da proposta',
      category: 'Prospecção',
      status: 'active',
      body_html: '<p>Olá {{person.first_name}}, veja sua proposta.</p>'
    )
  end

  let!(:template2) do
    ::Sales::EmailTemplate.create!(
      company: company,
      name: 'Follow-up Rascunho',
      subject_template: 'Ainda em dúvida?',
      category: 'Follow-up',
      status: 'draft',
      user: user,
      body_html: '<p>Podemos conversar?</p>'
    )
  end

  let!(:other_template) do
    ::Sales::EmailTemplate.create!(
      company: other_company,
      name: 'Outra Empresa',
      subject_template: 'Assunto outro',
      category: 'Prospecção',
      status: 'active',
      body_html: '<p>Outro tenant</p>'
    )
  end

  def auth_headers(account)
    token = JWT.encode({ user_id: account.id, typ: 'access', exp: 1.day.from_now.to_i }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end

  describe 'GET /api/v1/sales/email_templates' do
    it 'returns paginated list of templates for current tenant' do
      get '/api/v1/sales/email_templates', headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['templates'].size).to eq(2)
      expect(json['meta']['total']).to eq(2)
      expect(json['meta']['page']).to eq(1)
    end

    it 'filters by search q' do
      get '/api/v1/sales/email_templates?q=Proposta', headers: auth_headers(user)

      json = JSON.parse(response.body)
      expect(json['templates'].size).to eq(1)
      expect(json['templates'].first['name']).to eq('Proposta Comercial')
    end

    it 'filters by category' do
      get '/api/v1/sales/email_templates?category=Follow-up', headers: auth_headers(user)

      json = JSON.parse(response.body)
      expect(json['templates'].size).to eq(1)
      expect(json['templates'].first['category']).to eq('Follow-up')
    end

    it 'filters by status' do
      get '/api/v1/sales/email_templates?status=draft', headers: auth_headers(user)

      json = JSON.parse(response.body)
      expect(json['templates'].size).to eq(1)
      expect(json['templates'].first['status']).to eq('draft')
    end
  end

  describe 'GET /api/v1/sales/email_templates/stats' do
    it 'returns count metrics' do
      get '/api/v1/sales/email_templates/stats', headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['total']).to eq(2)
      expect(json['active']).to eq(1)
      expect(json['draft']).to eq(1)
      expect(json['shared']).to eq(1)
    end
  end

  describe 'GET /api/v1/sales/email_templates/variables' do
    it 'returns variable groups' do
      get '/api/v1/sales/email_templates/variables', headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['groups']).to be_an(Array)
      expect(json['groups'].first['key']).to eq('person')
    end
  end

  describe 'GET /api/v1/sales/email_templates/categories' do
    it 'returns distinct categories' do
      get '/api/v1/sales/email_templates/categories', headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['categories']).to include('Follow-up', 'Prospecção')
    end
  end

  describe 'POST /api/v1/sales/email_templates/:id/duplicate' do
    it 'duplicates template into a draft' do
      post "/api/v1/sales/email_templates/#{template1.id}/duplicate", headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json.dig('template', 'name')).to eq('Proposta Comercial (cópia)')
      expect(json.dig('template', 'status')).to eq('draft')
    end
  end

  describe 'POST /api/v1/sales/email_templates/:id/archive' do
    it 'archives the template' do
      post "/api/v1/sales/email_templates/#{template1.id}/archive", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig('template', 'status')).to eq('archived')
    end
  end

  describe 'POST /api/v1/sales/email_templates/:id/test_send' do
    let(:provider_double) { instance_double(Sales::Messaging::Providers::Ses) }

    context 'when provider succeeds' do
      before do
        allow(Sales::Messaging::Providers::Ses).to receive(:new).and_return(provider_double)
        allow(provider_double).to receive(:send_message).and_return(
          Sales::Messaging::Providers::Base::Result.new(
            success?: true,
            provider_message_id: 'msg-ses-test-123'
          )
        )
      end

      it 'returns 200 with provider_message_id and sent status' do
        expect do
          post "/api/v1/sales/email_templates/#{template1.id}/test_send",
               params: { to_email: 'teste@exemplo.com' },
               headers: auth_headers(user),
               as: :json
        end.to change(Sales::EmailMessage, :count).by(1)

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['to_email']).to eq('teste@exemplo.com')
        expect(json['provider_message_id']).to eq('msg-ses-test-123')
        expect(json.dig('rendered', 'subject')).to include('Sua proposta de energia solar')

        created_msg = Sales::EmailMessage.last
        expect(created_msg.status).to eq('sent')
        expect(created_msg.provider_message_id).to eq('msg-ses-test-123')
      end

      it 'uses unsaved draft without modifying persisted template' do
        original_name = template1.name
        original_subject = template1.subject_template

        post "/api/v1/sales/email_templates/#{template1.id}/test_send",
             params: {
               to_email: 'draft@exemplo.com',
               draft: {
                 subject_template: 'Assunto Rascunho Temporário {{person.first_name}}'
               }
             },
             headers: auth_headers(user),
             as: :json

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json.dig('rendered', 'subject')).to include('Assunto Rascunho Temporário')

        template1.reload
        expect(template1.subject_template).to eq(original_subject)
        expect(template1.name).to eq(original_name)
      end
    end

    context 'when provider fails' do
      before do
        allow(Sales::Messaging::Providers::Ses).to receive(:new).and_return(provider_double)
        allow(provider_double).to receive(:send_message).and_return(
          Sales::Messaging::Providers::Base::Result.new(
            success?: false,
            error_code: 'SES_SEND_ERROR',
            error_message: 'Erro simulado no provider'
          )
        )
      end

      it 'returns 422 with error message and does not report success' do
        post "/api/v1/sales/email_templates/#{template1.id}/test_send",
             params: { to_email: 'teste@exemplo.com' },
             headers: auth_headers(user),
             as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json.dig('error', 'message')).to eq('Erro simulado no provider')
        expect(json.dig('error', 'code')).to eq('TEST_SEND_FAILED')

        created_msg = Sales::EmailMessage.last
        expect(created_msg.status).to eq('failed')
      end
    end

    context 'when SES is not configured' do
      before do
        allow(Sales::Messaging::Providers::Ses).to receive(:new).and_return(provider_double)
        allow(provider_double).to receive(:send_message).and_return(
          Sales::Messaging::Providers::Base::Result.new(
            success?: false,
            error_code: 'SES_NOT_CONFIGURED',
            error_message: 'AWS SES não configurado.'
          )
        )
      end

      it 'returns 422 with SES_NOT_CONFIGURED error' do
        post "/api/v1/sales/email_templates/#{template1.id}/test_send",
             params: { to_email: 'teste@exemplo.com' },
             headers: auth_headers(user),
             as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json.dig('error', 'message')).to eq('AWS SES não configurado.')
      end
    end

    context 'when recipient is suppressed' do
      before do
        if defined?(Sales::EmailSuppression)
          Sales::EmailSuppression.create!(
            company: company,
            email: 'suppressed@exemplo.com',
            reason: 'bounce'
          )
        end
      end

      it 'blocks delivery and returns 422 SUPPRESSED_EMAIL' do
        expect do
          post "/api/v1/sales/email_templates/#{template1.id}/test_send",
               params: { to_email: 'suppressed@exemplo.com' },
               headers: auth_headers(user),
               as: :json
        end.not_to change(Sales::EmailMessage, :count)

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json.dig('error', 'code')).to eq('SUPPRESSED_EMAIL')
      end
    end
  end
end
