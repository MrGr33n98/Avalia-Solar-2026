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
    company = create(:company, active_admin: false)

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
