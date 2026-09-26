# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales Opportunities Email Timeline API', type: :request do
  let(:company) do
    Company.new(name: 'Empresa Teste Timeline', slug: "empresa-#{SecureRandom.hex(4)}").tap do |c|
      c.save!(validate: false)
    end
  end

  let(:user) do
    User.new(
      name: 'Sales User',
      email: "sales.#{SecureRandom.hex(4)}@avaliasolar.com.br",
      password: 'Password123!',
      role: 'admin',
      company_id: company.id,
      terms_accepted: true
    ).tap { |u| u.save!(validate: false) }
  end

  let(:headers) do
    token = JWT.encode({ user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i },
                       Rails.application.secret_key_base)
    {
      'Authorization' => "Bearer #{token}",
      'CONTENT_TYPE' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  let(:pipeline) { Sales::Pipeline.create!(name: 'B2B Pipeline', key: "b2b_#{SecureRandom.hex(4)}", active: true) }
  let!(:stage) { pipeline.stages.create!(key: 'prospect', name: 'Prospect', position: 1, probability: 20) }
  let(:account) { Sales::Account.create!(company_id: company.id, owner: user, name: 'WEG Solar') }
  let(:contact) { Sales::Contact.create!(account: account, first_name: 'Felipe', last_name: 'Oliveira', email: 'felipe@weg.com') }

  let!(:opportunity) do
    account.opportunities.create!(
      pipeline: pipeline,
      stage: stage,
      primary_contact: contact,
      owner: user,
      name: 'Projeto Solar 50kWp',
      value_cents: 150_000_00,
      currency: 'BRL',
      probability: 30,
      stage_entered_at: Time.current
    )
  end

  describe 'GET /api/v1/sales/opportunities/:id/timeline' do
    it 'returns a structured email item and classifies the pixel as an open signal' do
      email_message = Sales::EmailMessage.create!(
        company_id: company.id,
        sales_account_id: account.id,
        sales_contact_id: contact.id,
        sales_opportunity_id: opportunity.id,
        sender_user_id: user.id,
        from_email: user.email,
        to_email: 'cliente@exemplo.com',
        subject: 'Convite Avalia Solar',
        body_html: '<p>Proposta Solar</p>',
        open_tracking_enabled: true,
        open_count: 2,
        raw_open_signals: 2,
        unique_open_signals: 1,
        proxy_open_signals: 1,
        first_opened_at: 1.hour.ago,
        last_opened_at: 10.minutes.ago,
        delivery_status: 'sent',
        status: 'sent'
      )

      email_message.register_event!(event_type: 'open_signal', source: 'avalia_pixel', signal_class: 'proxy',
                                    classification_reasons: ['google_image_proxy'])

      get "/api/v1/sales/opportunities/#{opportunity.id}/timeline", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['timeline']).to be_an(Array)

      email_event = json['timeline'].find { |e| e['id'] == "email:#{email_message.id}" }
      expect(email_event).not_to be_nil
      expect(email_event['kind']).to eq('email')
      expect(email_event.dig('email', 'delivery_status')).to eq('sent')
      expect(email_event.dig('engagement', 'raw_open_signals')).to eq(3)
      expect(email_event.dig('engagement', 'unique_open_signals')).to eq(1)
      expect(email_event.dig('engagement', 'proxy_open_signals')).to eq(2)
      expect(email_event['lifecycle'].map { |event| event['type'] }).to include('open_signal')
      expect(email_event.to_json).not_to include('Lido')
      expect(json.dig('meta', 'cursor')).to be_present
    end

    it 'inclui email ligado apenas à conta somente quando a conta não tem outra oportunidade' do
      account_email = Sales::EmailMessage.create!(company_id: company.id, sales_account_id: account.id,
                                                  sales_contact_id: contact.id, sender_user_id: user.id,
                                                  from_email: user.email, to_email: contact.email,
                                                  subject: 'Email sem oportunidade direta', status: 'sent')

      get "/api/v1/sales/opportunities/#{opportunity.id}/timeline", headers: headers
      expect(JSON.parse(response.body)['timeline'].map { |event| event['id'] }).to include("email:#{account_email.id}")

      account.opportunities.create!(pipeline: pipeline, stage: stage, primary_contact: contact, owner: user,
                                    name: 'Outra oportunidade', value_cents: 1, currency: 'BRL', probability: 1,
                                    stage_entered_at: Time.current)
      get "/api/v1/sales/opportunities/#{opportunity.id}/timeline", headers: headers
      expect(JSON.parse(response.body)['timeline'].map do |event|
        event['id']
      end).not_to include("email:#{account_email.id}")
    end
  end
end
