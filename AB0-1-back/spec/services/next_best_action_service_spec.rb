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

      it "returns stable semantic identity fields" do
        company.categories.clear
        action = described_class.call(company).find { |item| item[:id] == "add_categories" }
        expect(action).to include(key: "profile_add_categories", reason_code: "CATEGORIES_MISSING", destination: "product-categories", entity_context: {})
      end
    end
  end
end
