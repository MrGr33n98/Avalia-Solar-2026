require 'rails_helper'

RSpec.describe 'Auth any-domain access', type: :request do
  let(:password) { 'Password123' }

  let!(:user) do
    User.create!(
      name: 'Felipe Henrique',
      email: 'felipe@avaliasolar.com.br',
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

  describe 'POST /api/v1/auth/login' do
    it 'allows login for non-corporate domains' do
      post '/api/v1/auth/login', params: { email: user.email, password: password }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['token']).to be_present
      expect(body['user']).to be_present
    end
  end
end
