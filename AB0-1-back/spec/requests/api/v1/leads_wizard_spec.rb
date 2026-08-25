require 'rails_helper'

RSpec.describe 'Leads wizard API', type: :request do
  before do
    allow(CNPJ).to receive(:valid?).and_return(true)
    ActionMailer::Base.perform_deliveries = true
    ActionMailer::Base.deliveries.clear
  end

  let(:category) { Category.create!(name: 'Solar', description: 'Categoria de energia solar') }
  let(:other_category) { Category.create!(name: 'Mobilidade', description: 'Categoria de mobilidade') }
  let(:paid_plan) do
    Plan.create!(name: "Pro Wizard #{SecureRandom.hex(4)}", price: 99, features_json: { 'custom_ctas' => true })
  end

  def create_company(attrs = {})
    random_id = SecureRandom.hex(4)
    cnpj_val = Array.new(14) { rand(10) }.join
    base_attrs = {
      name: 'Solar Company',
      description: 'Descricao da empresa',
      email: "contato_#{random_id}@empresa.com",
      state: 'RJ',
      city: 'Rio de Janeiro',
      phone: '21999999999',
      status: 'active',
      verified: true,
      featured: false,
      active_admin: true,
      cnpj: cnpj_val,
      plan: paid_plan
    }
    base_attrs[:plan_status] = 'active' if Company.column_names.include?('plan_status')

    assigned_categories = attrs.delete(:categories) || [category]

    company = Company.new(base_attrs.merge(attrs))
    company.categories = assigned_categories
    company.save!
    company
  end

  let!(:company_a) { create_company(name: 'Company A', featured: true, rating_avg: 4.7) }
  let!(:company_b) { create_company(name: 'Company B', featured: false, rating_avg: 4.3) }
  let!(:company_c) { create_company(name: 'Company C', featured: false, rating_avg: 4.1) }
  let!(:company_other_vertical) { create_company(name: 'Company EV', categories: [other_category]) }

  it 'creates wizard lead and verifies otp' do
    allow(Lead).to receive(:generate_otp_code).and_return('123456')
    attribution_payload = {
      first_touch: {
        values: {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'wizard_launch'
        },
        landing_path: '/companies/company-b',
        referrer_host: 'google.com',
        ts: Time.current.iso8601
      },
      last_touch: {
        values: {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'wizard_launch',
          utm_content: 'banner_a'
        },
        landing_path: '/companies/company-b',
        referrer_host: 'google.com',
        ts: Time.current.iso8601
      },
      ttl_days: 30
    }

    post '/api/v1/leads/wizard_create', params: {
      lead: {
        product_vertical: 'Energia Solar',
        project_profile: 'Residencial',
        quote_type: 'Energia Solar',
        system_size_band: 'Ate 7 kWp',
        decision_timeline: 'Agora',
        address_full: 'Rua C, 50 - Rio de Janeiro/RJ',
        city: 'Rio de Janeiro',
        state: 'RJ',
        full_name: 'Lead Test',
        email: 'lead@example.com',
        phone: '21999999999',
        consent: true
      },
      preferred_company_id: company_b.id,
      utm: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'wizard_launch',
        utm_content: 'banner_a',
        utm_term: 'energia-solar',
        gclid: 'gclid-123',
        fbclid: 'fbclid-456',
        msclkid: 'msclkid-789',
        landing_path: '/companies/company-b',
        referrer_host: 'google.com'
      },
      attribution: attribution_payload
    }

    expect(response).to have_http_status(:created)
    create_payload = JSON.parse(response.body)
    lead_id = create_payload['lead_id']
    created_lead = Lead.find(lead_id)
    expect(create_payload['verification_channel']).to eq('email')
    expect(create_payload['email_hint']).to be_present
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    expect(ActionMailer::Base.deliveries.last.to).to include('lead@example.com')
    expect(created_lead.product_vertical).to eq('Energia Solar')
    expect(created_lead.project_profile).to eq('Residencial')
    expect(created_lead.quote_type).to eq('Energia Solar')
    expect(created_lead.system_size_band).to eq('Ate 7 kWp')
    expect(created_lead.decision_timeline).to eq('Agora')
    expect(created_lead.address_full).to eq('Rua C, 50 - Rio de Janeiro/RJ')
    expect(created_lead.utm_source).to eq('google')
    expect(created_lead.utm_medium).to eq('cpc')
    expect(created_lead.utm_campaign).to eq('wizard_launch')
    expect(created_lead.utm_content).to eq('banner_a')
    expect(created_lead.utm_term).to eq('energia-solar')
    expect(created_lead.gclid).to eq('gclid-123')
    expect(created_lead.fbclid).to eq('fbclid-456')
    expect(created_lead.msclkid).to eq('msclkid-789')
    expect(created_lead.landing_path).to eq('/companies/company-b')
    expect(created_lead.referrer_host).to eq('google.com')
    expect(created_lead.attribution_json).to include('first_touch', 'last_touch', 'ttl_days')
    Lead.find(lead_id).update_column(:otp_sent_at, 2.minutes.ago)

    post "/api/v1/leads/#{lead_id}/send_otp"

    expect(response).to have_http_status(:ok)
    send_otp_payload = JSON.parse(response.body)
    expect(send_otp_payload['verification_channel']).to eq('email')
    expect(send_otp_payload['email_hint']).to be_present
    expect(ActionMailer::Base.deliveries.size).to eq(2)

    post "/api/v1/leads/#{lead_id}/verify_otp", params: { otp_code: '123456' }

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload['companies']).to eq([])
    expect(Lead.find(lead_id).wizard_status).to eq('routing')
    expect(LeadRoutingJob).to have_been_enqueued.with(lead_id, company_b.id)
  end

  it 'accepts camelCase wizard payloads from the multi-step modal' do
    allow(Lead).to receive(:generate_otp_code).and_return('123456')

    post '/api/v1/leads/wizard_create', params: {
      lead: {
        productVertical: 'Energia Solar',
        projectProfile: 'Residencial',
        quoteType: 'Energia Solar',
        systemSizeBand: 'Ate 7 kWp',
        decisionTimeline: 'Agora',
        addressFull: 'Rua D, 75 - Rio de Janeiro/RJ',
        fullName: 'Lead Camel',
        email: 'camel@example.com',
        phone: '21988887777',
        consent: true
      },
      preferred_company_id: company_a.id
    }

    expect(response).to have_http_status(:created)

    lead = Lead.order(:created_at).last
    expect(lead.name).to eq('Lead Camel')
    expect(lead.product_vertical).to eq('Energia Solar')
    expect(lead.project_profile).to eq('Residencial')
    expect(lead.quote_type).to eq('Energia Solar')
    expect(lead.system_size_band).to eq('Ate 7 kWp')
    expect(lead.decision_timeline).to eq('Agora')
    expect(lead.address_full).to eq('Rua D, 75 - Rio de Janeiro/RJ')
  end

  it 'rejects wizard lead creation when the preferred company does not serve the selected category' do
    post '/api/v1/leads/wizard_create', params: {
      lead: {
        project_profile: 'Residencial',
        system_size_band: 'Ate 7 kWp',
        decision_timeline: 'Agora',
        full_name: 'Lead Invalido',
        email: 'invalido@example.com',
        phone: '21999999999',
        zipcode: '21941000',
        consent: true,
        category_id: category.id
      },
      preferred_company_id: company_other_vertical.id
    }

    expect(response).to have_http_status(:unprocessable_entity)

    payload = JSON.parse(response.body)
    expect(payload.dig('error', 'code')).to eq('VALIDATION_FAILED')
    expect(payload.dig('error', 'retryable')).to be(false)
    expect(payload.dig('error', 'fields', 'preferred_company_id')).to be_present
  end

  it 'retorna contexto do lead quando envio de e-mail falha' do
    allow(Lead).to receive(:generate_otp_code).and_return('123456')
    allow(LeadVerificationMailer).to receive(:verification_code).and_raise(StandardError, 'SMTP indisponível')

    post '/api/v1/leads/wizard_create', params: {
      lead: {
        product_vertical: 'Energia Solar', project_profile: 'Residencial',
        quote_type: 'Energia Solar', system_size_band: 'Ate 7 kWp',
        decision_timeline: 'Agora', address_full: 'Rua Teste, 1',
        full_name: 'Lead SMTP', email: 'smtp@example.com',
        phone: '21999999999', consent: true
      },
      preferred_company_id: company_a.id
    }

    expect(response).to have_http_status(:service_unavailable)
    payload = JSON.parse(response.body)
    expect(payload.dig('error', 'code')).to eq('EMAIL_DELIVERY_FAILED')
    expect(payload.dig('error', 'lead_id')).to be_present
    expect(payload.dig('error', 'email_hint')).to eq('sm***@example.com')
  end
end
