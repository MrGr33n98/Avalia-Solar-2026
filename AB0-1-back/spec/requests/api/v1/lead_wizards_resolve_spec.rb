require 'rails_helper'

RSpec.describe 'Lead wizards resolve API', type: :request do
  before do
    allow(CNPJ).to receive(:valid?).and_return(true)
  end

  let(:category) { Category.create!(name: 'Solar', description: 'Categoria solar') }
  let(:other_category) { Category.create!(name: 'Mobilidade', description: 'Categoria EV') }

  def create_company(name:, categories:)
    base_attrs = {
      name: name,
      description: 'Descricao da empresa',
      email: "#{name.parameterize}@empresa.com",
      state: 'RJ',
      city: 'Rio de Janeiro',
      phone: '21999999999',
      status: 'active',
      verified: true,
      featured: false,
      active_admin: true,
      cnpj: '12345678901234'
    }
    base_attrs[:plan_status] = 'active' if Company.column_names.include?('plan_status')

    company = Company.new(base_attrs)
    company.categories = categories
    company.save!
    company
  end

  it 'returns availability metadata for the preferred company' do
    company = create_company(name: 'Empresa Solar', categories: [category])

    get '/api/v1/lead_wizards/resolve', params: {
      category_id: category.id,
      preferred_company_id: company.id
    }

    expect(response).to have_http_status(:ok)

    payload = JSON.parse(response.body)
    expect(payload.dig('availability', 'company_available')).to eq(true)
    expect(payload.dig('availability', 'reason')).to eq('company_available')
  end

  it 'returns explicit unavailability when the preferred company is outside the category' do
    company = create_company(name: 'Empresa EV', categories: [other_category])

    get '/api/v1/lead_wizards/resolve', params: {
      category_id: category.id,
      preferred_company_id: company.id
    }

    expect(response).to have_http_status(:ok)

    payload = JSON.parse(response.body)
    expect(payload['source']).to eq('default')
    expect(payload.dig('availability', 'company_available')).to eq(false)
    expect(payload.dig('availability', 'reason')).to eq('company_not_in_category')
  end
end
