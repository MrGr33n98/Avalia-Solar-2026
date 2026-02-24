require 'rails_helper'

RSpec.describe 'Company access authorization', type: :request do
  let(:password) { 'Password123' }

  let!(:user) do
    User.create!(
      name: 'Usuario Review',
      email: 'review@qualquerdominio.com',
      password: password,
      password_confirmation: password,
      role: 'review',
      status: :active,
      city: 'Sao Paulo',
      state: 'SP',
      terms_accepted: true,
      terms_accepted_at: Time.current,
      confirmed_at: Time.current
    )
  end

  let(:company) { create(:company) }

  def auth_headers_for(target_user)
    token = JWT.encode(
      { user_id: target_user.id, exp: 1.hour.from_now.to_i },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}" }
  end

  describe 'GET /api/v1/company/pending_changes' do
    it 'blocks management endpoints when user has no approved company access' do
      get '/api/v1/company/pending_changes', headers: auth_headers_for(user)

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['code']).to eq('COMPANY_ACCESS_REQUIRED')
    end

    it 'allows management endpoints when Active Admin approval created active membership' do
      CompanyMember.create!(
        user: user,
        company: company,
        role: 'manager',
        status: 'active'
      )

      get '/api/v1/company/pending_changes', headers: auth_headers_for(user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['items']).to be_a(Array)
    end
  end
end
