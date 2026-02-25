require 'rails_helper'

RSpec.describe 'Authentication System', type: :model do
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
    let(:user) do
      User.create!(
        name: 'Test User',
        email: 'employee@solartech.com',
        password: 'Password123!',
        company: company,
        role: 'company',
        terms_accepted: true,
        approved_by_admin: false
      )
    end

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
