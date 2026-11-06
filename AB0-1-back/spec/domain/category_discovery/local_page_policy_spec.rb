# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CategoryDiscovery::LocalPagePolicy do
  describe '.evaluate (R36 / CDSI-099 anti-doorway local SEO policy)' do
    it 'marks an empty city scope as non-indexable with NOINDEX_LOCAL_EMPTY' do
      decision = described_class.evaluate(scope: Company.none, state: 'SP', city: 'Campinas')
      expect(decision.indexable).to be(false)
      expect(decision.robots).to eq('noindex,follow')
      expect(decision.reason_codes).to include('NOINDEX_LOCAL_EMPTY')
    end

    it 'prevents doorway indexing when a city has only 1 active company' do
      create(:company, status: 'active', state: 'SC', city: 'Joinville', verified: true)
      scope = Company.where(status: 'active', state: 'SC', city: 'Joinville')

      decision = described_class.evaluate(scope: scope, state: 'SC', city: 'Joinville')
      expect(decision.indexable).to be(false)
      expect(decision.reason_codes).to include('NOINDEX_DOORWAY_CITY_SINGLE_COMPANY')
    end

    it 'allows indexing when a city has >= 2 active companies including at least 1 verified company' do
      create(:company, status: 'active', state: 'PR', city: 'Curitiba', verified: true)
      create(:company, status: 'active', state: 'PR', city: 'Curitiba', verified: false)
      scope = Company.where(status: 'active', state: 'PR', city: 'Curitiba')

      decision = described_class.evaluate(scope: scope, state: 'PR', city: 'Curitiba')
      expect(decision.indexable).to be(true)
      expect(decision.robots).to eq('index,follow')
      expect(decision.reason_codes).to be_empty
    end
  end
end

