require 'rails_helper'

RSpec.describe 'Lead distributions API', type: :request do
  let!(:company) { create(:company, status: :active) }
  let!(:other_company) { create(:company, status: :active) }
  let!(:user) { create(:user, company: company, role: :company) }
  let!(:other_user) { create(:user, company: other_company, role: :company) }
  let!(:distribution) { create(:lead_distribution, company: company, status: :sent) }

  def auth_headers_for(user)
    token = JWT.encode({ user_id: user.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end

  it 'permite empresa dona aceitar distribuição' do
    post "/api/v1/lead_distributions/#{distribution.id}/accept", headers: auth_headers_for(user)

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig('distribution', 'status')).to eq('accepted')
  end

  it 'nega acesso de outra empresa' do
    get "/api/v1/lead_distributions/#{distribution.id}", headers: auth_headers_for(other_user)

    expect(response).to have_http_status(:forbidden)
  end

  it 'rejeita com reason code' do
    post "/api/v1/lead_distributions/#{distribution.id}/reject",
         params: { reason: 'outside_area' },
         headers: auth_headers_for(user)

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig('distribution', 'rejection_reason')).to eq('outside_area')
  end

  it 'marca viewed ao abrir distribuição enviada' do
    get "/api/v1/lead_distributions/#{distribution.id}", headers: auth_headers_for(user)

    expect(response).to have_http_status(:ok)
    expect(distribution.reload).to be_viewed_status
    expect(distribution.viewed_at).to be_present
  end
end
