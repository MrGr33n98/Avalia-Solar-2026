require 'rails_helper'

RSpec.describe PlanFeatureCatalog do
  describe '.normalize' do
    it 'maps legacy aliases into canonical keys' do
      normalized = described_class.normalize(
        { active_admin: true, social_proof_enabled: true, media_direct_update: true },
        plan_tier: 'free'
      )

      expect(normalized['custom_ctas']).to be(true)
      expect(normalized['social_proof']).to be(true)
      expect(normalized['profile_media_direct_update']).to be(true)
    end

    it 'applies tier defaults for pro plans' do
      normalized = described_class.normalize({}, plan_tier: 'pro')

      expect(normalized['custom_ctas']).to be(true)
      expect(normalized['show_alternatives']).to be(false)
      expect(normalized['sector_question_limit']).to eq(10)
    end
  end

  describe '.infer_plan_tier' do
    it 'infers enterprise when webhook capabilities are present' do
      tier = described_class.infer_plan_tier(
        name: 'Plano Custom',
        price: 499.0,
        features: { webhooks: true }
      )

      expect(tier).to eq('enterprise')
    end

    it 'infers pro for paid commercial plans' do
      tier = described_class.infer_plan_tier(
        name: 'Plano Pro',
        price: 99.0,
        features: {}
      )

      expect(tier).to eq('pro')
    end
  end
end
