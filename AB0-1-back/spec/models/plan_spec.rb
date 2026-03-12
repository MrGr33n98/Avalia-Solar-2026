require 'rails_helper'

RSpec.describe Plan do
  describe 'feature normalization' do
    it 'applies the selected template tier before validation' do
      plan = described_class.new(
        name: 'Plano Comercial',
        price: 0,
        description: 'Plano estruturado',
        features_json: {}
      )

      plan.plan_tier_template = 'pro'
      plan.valid?

      expect(plan.features_json['custom_ctas']).to be(true)
      expect(plan.features_json['advanced_analytics']).to be(true)
      expect(plan.features_json['sector_question_limit']).to eq(10)
      expect(JSON.parse(plan.features)['custom_ctas']).to be(true)
      expect(plan.enabled_feature_keys).to include('custom_ctas')
      expect(plan.enabled_feature_keys).not_to include('sector_question_limit')
    end
  end

  describe 'feature validation' do
    it 'rejects pricing modules without custom ctas' do
      plan = described_class.new(
        name: 'Plano Invalido',
        price: 0,
        features_json: {
          'pricing_table' => true,
          'custom_ctas' => false
        }
      )

      expect(plan).not_to be_valid
      expect(plan.errors[:features_json]).to include('pricing_table e special_offer exigem custom_ctas habilitado')
    end

    it 'rejects intent scores without advanced analytics' do
      plan = described_class.new(
        name: 'Plano Intent',
        price: 0,
        features_json: {
          'intent_scores' => true,
          'advanced_analytics' => false,
          'webhooks' => false
        }
      )

      expect(plan).not_to be_valid
      expect(plan.errors[:features_json]).to include('intent_scores exige advanced_analytics')
    end

    it 'rejects webhooks without intent scores' do
      plan = described_class.new(
        name: 'Plano Webhook',
        price: 0,
        features_json: {
          'webhooks' => true,
          'intent_scores' => false
        }
      )

      expect(plan).not_to be_valid
      expect(plan.errors[:features_json]).to include('webhooks exige intent_scores')
    end
  end
end
