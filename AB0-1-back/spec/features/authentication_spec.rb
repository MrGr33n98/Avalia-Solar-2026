require 'rails_helper'

RSpec.describe 'Authentication System', type: :model do
  let(:company) { 
    Company.create!(
      name: 'Solar Tech',
      description: 'A solar company',
      website: 'solartech.com',
      email_public: 'contact@solartech.com',
      address: '123 Solar St',
      city: 'Sun City',
      state: 'SC',
      phone: '(11) 99999-9999',
      cnpj: '12.345.678/0001-90', # Valid CNPJ format usually required, using a dummy valid-looking one or skipping validation if possible. 
      # Assuming standard validation. If strict CNPJ validation is on, this might fail.
      # Let's try to make it valid enough or mock if needed.
      # Using a valid generator algorithm logic or just a known valid test CNPJ.
      # 00.000.000/0001-91 is valid.
      status: 'active'
    ) 
  }

  before do
    # Bypass CNPJ validation for test simplicity if needed, or provide valid one.
    # Actually, let's use a mock or a simple valid User for unit tests.
    allow(CNPJ).to receive(:valid?).and_return(true) 
  end

  describe 'Corporate Email Validation' do
    it 'rejects email not matching company domain' do
      user = User.new(
        name: 'Test User',
        email: 'test@gmail.com',
        password: 'Password123!',
        company: company,
        role: 'company',
        terms_accepted: true
      )
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include('must be from company domain (solartech.com)')
    end

    it 'accepts email matching company domain' do
      user = User.new(
        name: 'Test User',
        email: 'employee@solartech.com',
        password: 'Password123!',
        company: company,
        role: 'company',
        terms_accepted: true
      )
      # There might be other validations, but email should be fine.
      user.valid?
      expect(user.errors[:email]).to be_empty
    end
  end

  describe 'Approval Flow' do
    let(:user) { 
      User.create!(
        name: 'Test User',
        email: 'employee@solartech.com',
        password: 'Password123!',
        company: company,
        role: 'company',
        terms_accepted: true,
        approved_by_admin: false
      ) 
    }

    it 'is not active for authentication when not approved' do
      expect(user.active_for_authentication?).to be false
      expect(user.inactive_message).to eq :not_approved
    end

    it 'is active for authentication when approved' do
      user.update(approved_by_admin: true)
      expect(user.active_for_authentication?).to be true
    end
  end
end
