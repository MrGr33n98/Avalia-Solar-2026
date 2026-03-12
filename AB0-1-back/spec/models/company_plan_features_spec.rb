require 'rails_helper'

RSpec.describe Company, type: :model do
  describe '#effective_plan_features' do
    let(:plan) do
      create(
        :plan,
        price: 149.0,
        features: { social_proof: true, sector_question_limit: 6 }.to_json
      )
    end
    let(:company) { create(:company, plan: plan) }

    it 'parses plan feature payload safely' do
      features = company.effective_plan_features

      expect(features).to be_a(Hash)
      expect(features['social_proof']).to eq(true)
      expect(features['sector_question_limit']).to eq(6)
      expect(features['product_description']).to eq(true)
      expect(features['show_alternatives']).to eq(false)
    end
  end

  describe '#quote_feature_enabled?' do
    context 'when plan explicitly enables custom CTAs' do
      let(:plan) do
        create(
          :plan,
          name: 'Plano Pro',
          price: 149.0,
          features_json: { custom_ctas: true }
        )
      end
      let(:company) { create(:company, plan: plan, active_admin: false) }

      it 'uses the canonical feature flag instead of legacy active_admin' do
        expect(company.quote_feature_enabled?).to be(true)
      end
    end

    context 'when there is no explicit plan flag but legacy active_admin is true' do
      let(:plan) { create(:plan, name: 'Gratuito', price: 0, features: nil) }
      let(:company) { create(:company, plan: plan, active_admin: true) }

      it 'keeps transitional compatibility' do
        expect(company.quote_feature_enabled?).to be(true)
      end
    end
  end

  describe '#sector_question_limit' do
    context 'when free company has no explicit feature flag' do
      let(:plan) { create(:plan, price: 0, features: nil) }
      let(:company) { create(:company, plan: plan) }

      it 'returns free limit' do
        expect(company.sector_question_limit).to eq(Company::SECTOR_QUESTIONS_FREE_LIMIT)
      end
    end

    context 'when paid company has explicit limit from features' do
      let(:plan) { create(:plan, price: 299.0, features: { sector_question_limit: 8 }.to_json) }
      let(:company) { create(:company, plan: plan) }

      it 'returns configured limit' do
        expect(company.sector_question_limit).to eq(8)
      end
    end

    context 'when pro company has no explicit limit' do
      let(:plan) { create(:plan, name: 'Plano Pro', price: 299.0, features_json: {}) }
      let(:company) { create(:company, plan: plan, active_admin: false) }

      it 'returns the tier default limit' do
        expect(company.sector_question_limit).to eq(10)
      end
    end
  end

  describe '#requires_paid_plan_for_sector_question?' do
    let(:free_plan) { create(:plan, price: 0, features: nil) }
    let(:paid_plan) { create(:plan, price: 99.0, features: { sector_question_limit: 10 }.to_json) }

    it 'requires paid plan when free company exceeds free limit' do
      company = create(:company, plan: free_plan)
      expect(company.requires_paid_plan_for_sector_question?(new_count: 3)).to be(true)
    end

    it 'does not require paid plan for paid company above free limit' do
      company = create(:company, plan: paid_plan)
      expect(company.requires_paid_plan_for_sector_question?(new_count: 3)).to be(false)
    end
  end

  describe '#sector_question_limit_reached?' do
    let(:plan) { create(:plan, price: 199.0, features: { sector_question_limit: 3 }.to_json) }
    let(:company) { create(:company, plan: plan) }

    it 'returns true when next count is above plan limit' do
      expect(company.sector_question_limit_reached?(new_count: 4)).to be(true)
      expect(company.sector_question_limit_reached?(new_count: 3)).to be(false)
    end
  end
end
