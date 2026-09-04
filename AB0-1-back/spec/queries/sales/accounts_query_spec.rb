# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::AccountsQuery, type: :query do
  let!(:user) { create(:user) }
  let!(:other_user) { create(:user) }
  let!(:acc1) { create(:sales_account, name: 'Solar Tech Brasil', domain: 'solartech.com.br', owner: user, segment: 'Integrador / Instalador', city: 'Campinas', state: 'SP') }
  let!(:acc2) { create(:sales_account, name: 'Energia Distribuidora', domain: 'energiadist.com', owner: other_user, segment: 'Distribuidor', city: 'Curitiba', state: 'PR') }

  describe '#call' do
    it 'filters by search term' do
      result = described_class.call(Sales::Account.all, q: 'solartech')
      expect(result).to include(acc1)
      expect(result).not_to include(acc2)
    end

    it 'filters by owner_id' do
      result = described_class.call(Sales::Account.all, owner_id: user.id)
      expect(result).to include(acc1)
      expect(result).not_to include(acc2)
    end

    it 'filters by segment' do
      result = described_class.call(Sales::Account.all, segment: 'Distribuidor')
      expect(result).to include(acc2)
      expect(result).not_to include(acc1)
    end

    it 'filters by ids' do
      result = described_class.call(Sales::Account.all, ids: [acc2.id])
      expect(result.pluck(:id)).to eq([acc2.id])
    end

    it 'paginates results cleanly' do
      paginated = described_class.new(Sales::Account.all, {}).call.paginate_result(page: 1, per_page: 10)
      expect(paginated[:records].size).to eq(2)
      expect(paginated[:meta][:total]).to eq(2)
    end
  end
end
