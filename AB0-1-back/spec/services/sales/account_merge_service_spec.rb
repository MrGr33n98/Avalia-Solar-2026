# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::AccountMergeService, type: :service do
  let!(:user) { create(:user) }
  let!(:master) { create(:sales_account, name: 'Master Solar', domain: 'mastersolar.com.br', owner: user) }
  let!(:duplicate) { create(:sales_account, name: 'Master Solar Dup', domain: 'mastersolar.com.br', owner: user) }

  describe '#call' do
    it 'merges duplicate account into master account' do
      res = described_class.call(
        tenant_scope: Sales::Account.all,
        master_account_id: master.id,
        duplicate_account_id: duplicate.id,
        current_user: user
      )

      expect(res[:success]).to be true
      expect(Sales::Account.exists?(duplicate.id)).to be false
      expect(Sales::Account.exists?(master.id)).to be true
    end

    it 'raises error when merging account into itself' do
      expect {
        described_class.call(
          tenant_scope: Sales::Account.all,
          master_account_id: master.id,
          duplicate_account_id: master.id,
          current_user: user
        )
      }.to raise_error(ArgumentError)
    end
  end
end
