# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::TenantScope do
  let(:company_a) { create(:company) }
  let(:company_b) { create(:company) }

  let(:user_a) { create(:user, company: company_a) }
  let(:user_b) { create(:user, company: company_b) }
  let(:admin_user) { create(:user, role: 'admin') }

  let!(:account_a) { create(:sales_account, owner: user_a) }
  let!(:account_b) { create(:sales_account, owner: user_b) }

  describe '#accounts' do
    it 'returns accounts owned by tenant A users for user_a' do
      scope = Sales::TenantScope.for(user_a)
      expect(scope.accounts).to include(account_a)
      expect(scope.accounts).not_to include(account_b)
    end

    it 'returns all accounts for admin' do
      scope = Sales::TenantScope.for(admin_user)
      expect(scope.accounts).to include(account_a, account_b)
    end
  end
end
