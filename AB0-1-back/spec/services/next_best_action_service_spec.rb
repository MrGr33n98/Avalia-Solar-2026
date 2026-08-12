require 'rails_helper'

RSpec.describe NextBestActionService, type: :service do
  describe '.call' do
    let(:company) { create(:company) }

    context 'when company is nil' do
      it 'returns empty actions array' do
        actions = described_class.call(nil)
        expect(actions).to eq([])
      end
    end

    context 'when company has no categories' do
      it 'returns recommendation to add categories' do
        company.categories.clear
        actions = described_class.call(company)
        expect(actions.map { |a| a[:id] }).to include('add_categories')
      end
    end
  end
end
