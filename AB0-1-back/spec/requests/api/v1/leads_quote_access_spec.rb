require 'rails_helper'

RSpec.describe 'Leads quote access', type: :request do
  it 'permite criar lead quando a empresa tem active_admin true' do
    company = create(:company, active_admin: true)

    post '/api/v1/leads', params: {
      lead: {
        name: 'Lead Test',
        email: 'lead@example.com',
        phone: '11999999999',
        company_id: company.id
      }
    }

    expect(response).to have_http_status(:created)
  end

  it 'bloqueia criar lead quando a empresa tem active_admin false' do
    plan = Plan.find_by(name: 'Gratuito Sem CTA') || create(:plan, name: 'Gratuito Sem CTA', price: 0, features: nil)
    company = create(:company, plan: plan, active_admin: false, quote_cta_enabled: false)

    post '/api/v1/leads', params: {
      lead: {
        name: 'Lead Test',
        email: 'lead@example.com',
        phone: '11999999999',
        company_id: company.id
      }
    }

    expect(response).to have_http_status(:unprocessable_entity)
    body = JSON.parse(response.body)
    expect(body['errors'].join(' ')).to match(/empresa n.o habilitada para or.amentos/i)
  end
end
