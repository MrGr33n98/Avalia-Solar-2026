require 'rails_helper'

RSpec.describe 'FinancingProposals', type: :request do
  let!(:company) { Company.create!(name: 'Demo', status: 'active', active_admin: true) }

  it 'creates proposal and returns status' do
    post "/api/v1/companies/#{company.id}/financing_proposals", params: {
      amount: 10000,
      months: 24,
      audience: 'pf',
      name: 'Cliente',
      email: 'cliente@example.com',
      phone: '11999999999'
    }
    expect(response).to have_http_status(:created)
    data = JSON.parse(response.body)
    expect(data['proposal_id']).to be_present

    get "/api/v1/companies/#{company.id}/financing_proposals/#{data['proposal_id']}/status"
    expect(response).to have_http_status(:ok)
    status = JSON.parse(response.body)
    expect(status['status']).to be_present
  end
end
