require 'rails_helper'

RSpec.describe MarketplaceProposal, type: :model do
  subject(:proposal) { build(:marketplace_proposal) }

  it { is_expected.to validate_presence_of(:reference) }
  it { is_expected.to validate_uniqueness_of(:reference) }

  it 'calcula o total da versão a partir dos itens' do
    proposal.save!
    version = proposal.versions.create!(number: 1, title: 'Proposta', valid_until: 30.days.from_now)
    version.items.create!(name: 'Sistema solar', quantity: 1, unit_price_cents: 2_690_000)
    version.terms.create!(key: 'warranty', label: 'Garantia', value: '12 anos')
    version.publish!
    expect(version.reload.total_cents).to eq(2_690_000)
  end

  it 'não publica uma versão sem validade, condições e total positivo' do
    proposal.save!
    version = proposal.versions.create!(number: 1, title: 'Proposta')
    version.items.create!(name: 'Sistema solar', quantity: 1, unit_price_cents: 0)

    expect { version.publish! }.to raise_error(ActiveRecord::RecordInvalid)
    expect(version.reload.status).to eq('draft')
  end
end
