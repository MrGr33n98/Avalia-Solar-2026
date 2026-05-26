require 'rails_helper'

RSpec.describe Billing::AdminAction, type: :model do
  describe 'Associations' do
    it 'belongs to admin_user' do
      association = described_class.reflect_on_association(:admin_user)
      expect(association.macro).to eq(:belongs_to)
    end

    it 'belongs to company' do
      association = described_class.reflect_on_association(:company)
      expect(association.macro).to eq(:belongs_to)
    end

    it 'belongs to company_subscription optionally' do
      association = described_class.reflect_on_association(:company_subscription)
      expect(association.macro).to eq(:belongs_to)
      expect(association.options[:optional]).to be true
    end
  end

  describe 'Validations' do
    let(:admin_user) do
      AdminUser.create!(
        email: "admin_action_test_#{SecureRandom.hex(4)}@example.com",
        password: 'password123',
        password_confirmation: 'password123'
      )
    end
    let(:company) { create(:company) }

    it 'requires action_type' do
      action = described_class.new(admin_user: admin_user, company: company, action_type: nil, justification: 'test', performed_at: Time.current)
      expect(action).not_to be_valid
      expect(action.errors[:action_type]).to include("can't be blank")
    end

    it 'requires action_type to be in the valid actions list' do
      action = described_class.new(admin_user: admin_user, company: company, action_type: 'invalid_action', justification: 'test', performed_at: Time.current)
      expect(action).not_to be_valid
      expect(action.errors[:action_type]).to include("is not included in the list")
    end

    it 'requires justification' do
      action = described_class.new(admin_user: admin_user, company: company, action_type: 'sync_stripe', justification: nil, performed_at: Time.current)
      expect(action).not_to be_valid
      expect(action.errors[:justification]).to include("can't be blank")
    end

    it 'requires performed_at' do
      action = described_class.new(admin_user: admin_user, company: company, action_type: 'sync_stripe', justification: 'test', performed_at: nil)
      expect(action).not_to be_valid
      expect(action.errors[:performed_at]).to include("can't be blank")
    end

    it 'is valid with correct attributes' do
      action = described_class.new(admin_user: admin_user, company: company, action_type: 'sync_stripe', justification: 'test', performed_at: Time.current)
      expect(action).to be_valid
    end
  end
end
