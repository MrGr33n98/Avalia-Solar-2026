require 'rails_helper'

RSpec.describe 'Corporate domain enforcement', type: :request do
  let(:password) { 'Password123' }
  let(:invalid_domain_email) { 'felipe@avaliasolar.com.br' }
  let(:allowed_domain_email) { 'felipe@weg.net' }

  let!(:invalid_domain_user) do
    User.create!(
      name: 'Felipe Henrique',
      email: invalid_domain_email,
      password: password,
      password_confirmation: password,
      role: 'company',
      status: :active,
      terms_accepted: true,
      terms_accepted_at: Time.current,
      confirmed_at: Time.current
    )
  end

  describe 'POST /api/v1/auth/login' do
    it 'blocks login for non-corporate domains' do
      post '/api/v1/auth/login', params: { email: invalid_domain_email, password: password }

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['code']).to eq('CORPORATE_DOMAIN_NOT_ALLOWED')
    end
  end

  describe 'POST /api/v1/auth/register' do
    it 'blocks registration for non-corporate domains' do
      post '/api/v1/auth/register', params: {
        user: {
          name: 'Novo Usuario',
          email: 'novo@avaliasolar.com.br',
          password: password,
          password_confirmation: password,
          role: 'review',
          terms_accepted: true
        }
      }

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['code']).to eq('CORPORATE_DOMAIN_NOT_ALLOWED')
    end

    it 'allows registration for allowed corporate domains' do
      post '/api/v1/auth/register', params: {
        user: {
          name: 'Novo Usuario',
          email: allowed_domain_email,
          password: password,
          password_confirmation: password,
          role: 'review',
          terms_accepted: true
        }
      }

      expect(response).not_to have_http_status(:forbidden)
    end
  end

  describe 'restricted account endpoints' do
    def auth_headers_for(user)
      token = JWT.encode(
        { user_id: user.id, exp: 1.hour.from_now.to_i },
        Rails.application.secret_key_base,
        'HS256'
      )
      { 'Authorization' => "Bearer #{token}" }
    end

    def fake_png_upload
      file = Tempfile.new(['avatar', '.png'])
      file.write('fake png binary data')
      file.rewind
      Rack::Test::UploadedFile.new(file.path, 'image/png')
    end

    it 'blocks profile update when operation is restricted' do
      put "/api/v1/users/#{invalid_domain_user.id}",
          params: { user: { name: 'Nome Alterado' } },
          headers: auth_headers_for(invalid_domain_user)

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['code']).to eq('CORPORATE_DOMAIN_NOT_ALLOWED')
    end

    it 'bypasses domain validation for avatar-only update' do
      put "/api/v1/users/#{invalid_domain_user.id}",
          params: { user: { avatar: fake_png_upload } },
          headers: auth_headers_for(invalid_domain_user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['avatar_url']).to be_present
    end
  end
end
