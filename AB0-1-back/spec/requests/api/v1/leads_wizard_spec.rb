require 'rails_helper'

RSpec.describe 'Leads wizard API', type: :request do
  before do
    allow(CNPJ).to receive(:valid?).and_return(true)
  end

  let(:category) { Category.create!(name: 'Solar', description: 'Categoria de energia solar') }

  def create_company(attrs = {})
    company = Company.new({
      name: 'Solar Company',
      description: 'Descricao da empresa',
      email: 'contato@empresa.com',
      state: 'RJ',
      city: 'Rio de Janeiro',
      phone: '21999999999',
      status: 'active',
      verified: true,
      featured: false,
      plan_status: 'active',
      active_admin: true,
      cnpj: '12345678901234'
    }.merge(attrs))
    company.categories << category
    company.save!
    company
  end

  let!(:company_a) { create_company(name: 'Company A', featured: true, rating_avg: 4.7) }
  let!(:company_b) { create_company(name: 'Company B', featured: false, rating_avg: 4.3) }
  let!(:company_c) { create_company(name: 'Company C', featured: false, rating_avg: 4.1) }

  it 'creates wizard lead and verifies otp' do
    allow(Lead).to receive(:generate_otp_code).and_return('123456')

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
      preferred_company_id: company_b.id
    }

    expect(response).to have_http_status(:created)
    lead_id = JSON.parse(response.body)['lead_id']

    post "/api/v1/leads/#{lead_id}/verify_otp", params: { otp_code: '123456' }

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload['companies'].size).to eq(3)
    expect(payload['companies'].first['id']).to eq(company_b.id)
  end
end
