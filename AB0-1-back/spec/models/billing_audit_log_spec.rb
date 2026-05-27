require 'rails_helper'

RSpec.describe BillingAuditLog, type: :model do
  describe 'validations' do
    it 'can be created with valid attributes' do
      company = create(:company)
      user = create(:user, company: company)
      
      log = BillingAuditLog.create!(
        company: company,
        user: user,
        action: :checkout_initiated,
        plan_id: 1,
        metadata: { ip_address: '127.0.0.1' }
      )
      
      expect(log).to be_persisted
      expect(log.action).to eq('checkout_initiated')
    end
  end
end
