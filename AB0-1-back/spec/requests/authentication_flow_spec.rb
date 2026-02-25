require 'rails_helper'

RSpec.describe 'Authentication Flow', type: :request do
  let(:category) do
    Category.create!(name: 'Energia Solar', description: 'Categoria de testes')
  end
  let(:company) do
    company = Company.new(
      name: 'Solar Tech',
      description: 'A solar company',
      website: 'http://solartech.com',
      email: 'contato@solartech.com',
      email_public: 'contact@solartech.com',
      address: '123 Solar St',
      city: 'Florianópolis',
      state: 'SC',
      phone: '(11) 99999-9999',
      status: 'active'
    )
    company.categories << category
    company.save!
    company
  end

  describe 'User Registration' do
    it 'creates a pending user by default' do
      post '/api/v1/auth/signup', params: {
        user: {
          name: 'New User',
          email: 'new@solartech.com',
          password: 'Password123!',
          password_confirmation: 'Password123!',
          date_of_birth: '1990-01-01',
          city: 'Florianópolis',
          state: 'SC',
          terms_accepted: true,
          company_id: company.id
        }
      }

      puts "Validation Errors: #{JSON.parse(response.body)['details']}" if response.status == 422
      expect(response).to have_http_status(:success)
      user = User.find_by(email: 'new@solartech.com')
      expect(user).to be_present
      expect(user.status).to eq('pending')
      expect(user.active_for_authentication?).to be false
    end
  end

  describe 'Admin Approval' do
    let(:user) do
      User.create!(
        name: 'Pending User',
        email: 'pending@solartech.com',
        password: 'Password123!',
        company: company,
        role: 'company',
        terms_accepted: true,
        status: :pending
      )
    end

    it 'allows login after approval' do
      user.confirm # Ensure the user is confirmed, otherwise Devise blocks them anyway
      expect(user.active_for_authentication?).to be false

      user.update(status: :active)

      expect(user.active_for_authentication?).to be true
    end

    it 'blocks login after rejection' do
      user.update(status: :rejected, rejection_reason: 'Invalid email')
      expect(user.active_for_authentication?).to be false
      expect(user.inactive_message).to eq(:rejected)
    end
  end

  describe 'Email Confirmation Flow' do
    let(:user) do
      User.create!(
        name: 'Unconfirmed User',
        email: 'unconfirmed@solartech.com',
        password: 'Password123!',
        role: 'user',
        terms_accepted: true,
        status: :pending,
        city: 'Florianópolis'
      )
    end

    it 'activates the user and allows login after confirmation' do
      # Gera o token de confirmação
      raw_token = user.instance_variable_get(:@raw_confirmation_token)
      if raw_token.nil?
        # Se não estiver na instância (ex: carregado do banco), geramos um novo
        raw_token, enc_token = Devise.token_generator.generate(User, :confirmation_token)
        user.update(confirmation_token: enc_token, confirmation_sent_at: Time.now)
      end

      # Tenta confirmar via API
      post '/api/v1/auth/confirm_email', headers: { 'Authorization' => "Bearer #{raw_token}" }

      expect(response).to have_http_status(:success)
      user.reload
      expect(user.confirmed?).to be true
      expect(user.status).to eq('active')
      expect(user.active_for_authentication?).to be true
    end
  end
end
