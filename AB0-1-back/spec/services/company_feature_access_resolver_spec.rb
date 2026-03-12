require 'rails_helper'

RSpec.describe CompanyFeatureAccessResolver, type: :service do
  describe '.call' do
    context 'for a free company' do
      let(:plan) { create(:plan, name: 'Gratuito', price: 0, features_json: {}) }
      let(:company) { create(:company, plan: plan, active_admin: false, social_proof_enabled: false) }

      it 'returns locked public upsell features and enabled marketplace toggles' do
        access = described_class.call(company: company)

        expect(access['custom_ctas']).to include(
          'state' => 'locked',
          'value' => false,
          'reason' => 'upgrade_required'
        )
        expect(access['show_alternatives']).to include(
          'state' => 'enabled',
          'value' => true,
          'reason' => 'included_in_plan'
        )
        expect(access['webhooks']).to include(
          'state' => 'hidden',
          'value' => false
        )
      end
    end

    context 'for an enterprise company' do
      let(:plan) { create(:plan, name: 'Enterprise', price: 499.0, features_json: { webhooks: true }) }
      let(:company) { create(:company, plan: plan, active_admin: false, intent_tier: 'enterprise') }

      it 'returns enabled enterprise-only capabilities' do
        access = described_class.call(company: company)

        expect(access['webhooks']).to include('state' => 'enabled', 'value' => true)
        expect(access['intent_scores']).to include('state' => 'enabled', 'value' => true)
        expect(access['custom_ctas']).to include('state' => 'enabled', 'value' => true)
      end
    end
  end
end
