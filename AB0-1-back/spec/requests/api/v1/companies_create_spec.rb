require 'rails_helper'

RSpec.describe 'Companies create API', type: :request do
  let!(:category) { create(:category, status: 'active') }

  it 'creates a pending company without a redundant pending change' do
    payload = {
      company: {
        name: 'Solar Cadastro',
        description: 'Empresa em processo de cadastro.',
        cnpj: '11222333000181',
        email: 'cadastro@solar.example',
        email_public: 'contato@solar.example',
        state: 'SP',
        city: 'São Paulo',
        phone: '11999999999',
        category_ids: [category.id]
      }
    }

    expect {
      post '/api/v1/companies',
           params: payload.to_json,
           headers: { 'Content-Type' => 'application/json' }
    }.to change(Company, :count).by(1)

    expect(response).to have_http_status(:created)
    body = JSON.parse(response.body)
    expect(body.dig('company', 'name')).to eq('Solar Cadastro')

    company = Company.find(body.dig('company', 'id'))
    expect(company.status).to eq('pending')
    expect(company.category_ids).to contain_exactly(category.id)
    expect(company.moderation_status).to eq('pending_review')
    expect(company.submitted_at).to be_present
    expect(PendingChange.where(company: company)).to be_empty
  end
end
