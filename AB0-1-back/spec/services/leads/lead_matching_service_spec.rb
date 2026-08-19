require 'rails_helper'

RSpec.describe Leads::LeadMatchingService, type: :service do
  let!(:category) { create(:category, name: 'Solar') }
  let!(:eligible) do
    create(:company, status: :active, active_admin: true, verified: true, state: 'SP', city: 'São Paulo').tap do |company|
      company.categories << category
    end
  end
  let!(:wrong_category) { create(:company, status: :active, active_admin: true, state: 'SP', city: 'São Paulo') }
  let!(:inactive) { create(:company, status: :inactive, active_admin: true, state: 'SP', city: 'São Paulo') }
  let!(:lead) { create(:lead, wizard_status: :verified, category: category, state: 'SP', city: 'São Paulo') }

  before do
    allow(eligible).to receive(:quote_feature_enabled?).and_return(true)
    allow(wrong_category).to receive(:quote_feature_enabled?).and_return(true)
    allow(inactive).to receive(:quote_feature_enabled?).and_return(true)
  end

  it 'retorna apenas empresas elegíveis por status, categoria, região e feature' do
    matches = described_class.call(lead)

    expect(matches.map { |match| match[:company] }).to include(eligible)
    expect(matches.map { |match| match[:company] }).not_to include(wrong_category, inactive)
  end

  it 'não duplica distribuição existente' do
    create(:lead_distribution, lead: lead, company: eligible, status: :sent)

    expect(described_class.call(lead).map { |match| match[:company] }).not_to include(eligible)
  end
end
