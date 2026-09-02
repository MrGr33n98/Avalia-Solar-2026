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
    context 'when company has expiring campaigns' do
      it 'returns recommendation to renew campaign if approved banner is active and expiring within 3 days' do
        # banner active, approved, expiring in 2 days (<= 3 days, >= now)
        create(:banner, company: company, active: true, moderation_status: 'approved', start_date: 1.day.ago, end_date: 2.days.from_now)

        actions = described_class.call(company)
        expect(actions.map { |a| a[:id] }).to include('renew_campaigns')
      end

      it 'does not recommend renewal if banner is already expired' do
        create(:banner, company: company, active: true, moderation_status: 'approved', end_date: 1.hour.ago)

        actions = described_class.call(company)
        expect(actions.map { |a| a[:id] }).not_to include('renew_campaigns')
      end

      it 'does not recommend renewal if banner is inactive' do
        create(:banner, company: company, active: false, moderation_status: 'approved', end_date: 2.days.from_now)

        actions = described_class.call(company)
        expect(actions.map { |a| a[:id] }).not_to include('renew_campaigns')
      end

      it 'does not recommend renewal if banner is not approved (draft/rejected)' do
        create(:banner, company: company, active: true, moderation_status: 'draft', end_date: 2.days.from_now)
        create(:banner, company: company, active: true, moderation_status: 'rejected', end_date: 2.days.from_now)

        actions = described_class.call(company)
        expect(actions.map { |a| a[:id] }).not_to include('renew_campaigns')
      end

      it 'does not recommend renewal if banner has no end_date' do
        create(:banner, company: company, active: true, moderation_status: 'approved', end_date: nil)

        actions = described_class.call(company)
        expect(actions.map { |a| a[:id] }).not_to include('renew_campaigns')
      end
    end
  end
end
