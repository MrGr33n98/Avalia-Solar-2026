require 'rails_helper'

RSpec.describe CompanyHealthService, type: :service do
  describe '.call' do
    let(:company) { create(:company) }

    context 'when company is nil' do
      it 'returns default zero health' do
        health = described_class.call(nil)
        expect(health[:score]).to eq(0)
        expect(health[:status]).to eq('poor')
        expect(health[:dimensions][:profile]).to eq(0)
      end
    end

    context 'when company is created' do
      it 'calculates a profile health score' do
        health = described_class.call(company)
        expect(health[:score]).to be_between(0, 100)
        expect(health[:dimensions]).to have_key(:profile)
        expect(health[:dimensions]).to have_key(:reputation)
        expect(health[:dimensions]).to have_key(:content)
        expect(health[:dimensions]).to have_key(:discoverability)
        expect(health[:dimensions]).to have_key(:integration)
      end
    end
  end
end
