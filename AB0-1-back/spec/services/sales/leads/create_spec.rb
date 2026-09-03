# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Leads::Create do
  describe '.call' do
    it 'creates an opportunity with StageHistory atomically' do
      account = ::Sales::Account.create!(name: 'Indústria Solar S/A')

      result = described_class.call(
        actor: nil,
        attributes: {
          name: 'Usina Indústria 500kWp',
          sales_account_id: account.id,
          temperature: 'hot',
          value_cents: 50000000
        }
      )

      expect(result.success?).to be true
      expect(result.lead.name).to eq('Usina Indústria 500kWp')
      expect(result.lead.temperature).to eq('hot')
      expect(result.lead.stage_histories.count).to eq(1)
    end
  end
end
