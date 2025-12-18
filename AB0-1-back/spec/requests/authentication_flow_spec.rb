require 'rails_helper'

RSpec.describe 'Authentication Flow', type: :request do
  let(:company) { 
    Company.create!(
      name: 'Solar Tech',
      description: 'A solar company',
      website: 'http://solartech.com',
      email_public: 'contact@solartech.com',
      address: '123 Solar St',
      city: 'Sun City',
      state: 'SC',
      phone: '(11) 99999-9999',
      cnpj: '12.345.678/0001-90',
      status: 'active'
    ) 
  }

  describe 'User Registration' do
    it 'creates a pending user by default' do
      post '/api/v1/auth', params: {
        user: {
          name: 'New User',
          email: 'new@solartech.com',
          password: 'Password123!',
          password_confirmation: 'Password123!',
          date_of_birth: '1990-01-01',
          terms_accepted: true,
          company_id: company.id
        }
      }
      
      expect(response).to have_http_status(:success) # Or whatever your auth controller returns
      user = User.find_by(email: 'new@solartech.com')
      expect(user).to be_present
      expect(user.status).to eq('pending')
      expect(user.active_for_authentication?).to be false
    end
  end

  describe 'Admin Approval' do
    let(:user) { 
      User.create!(
        name: 'Pending User',
        email: 'pending@solartech.com',
        password: 'Password123!',
        company: company,
        role: 'company',
        terms_accepted: true,
        status: :pending
      ) 
    }

    it 'allows login after approval' do
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
end
