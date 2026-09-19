# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EntitlementService, type: :service do
  let(:free_company) do
    create(:company, name: 'Empresa Solar Free', plan: nil)
  end

  let(:pro_plan) do
    plan = Plan.find_or_create_by!(name: 'Plano Pro') do |p|
      p.price = 299.0
    end
    plan.update!(
      features_json: {
        'premium_profile' => true,
        'featured_products' => 10,
        'custom_ctas' => true,
        'p2p_chat' => true,
        'webhooks' => true,
        'company_categories_limit' => 5
      }
    )
    plan
  end

  let(:pro_company) do
    create(:company, name: 'Empresa Solar Pro', plan: pro_plan)
  end

  describe '.entitled?' do
    context 'with free company' do
      it 'returns false for locked premium features' do
        expect(described_class.entitled?(company: free_company, feature: 'premium_profile')).to be(false)
        expect(described_class.entitled?(company: free_company, feature: 'p2p_chat')).to be(false)
        expect(described_class.entitled?(company: free_company, feature: 'webhooks')).to be(false)
      end

      it 'returns true for standard default toggle features' do
        expect(described_class.entitled?(company: free_company, feature: 'product_description')).to be(true)
        expect(described_class.entitled?(company: free_company, feature: 'company_links_block')).to be(true)
      end

      it 'returns true for metered features with non-zero default limit' do
        expect(described_class.entitled?(company: free_company, feature: 'company_categories_limit')).to be(true)
      end
    end

    context 'with pro company' do
      it 'returns true for entitled features in plan' do
        expect(described_class.entitled?(company: pro_company, feature: 'premium_profile')).to be(true)
        expect(described_class.entitled?(company: pro_company, feature: 'p2p_chat')).to be(true)
        expect(described_class.entitled?(company: pro_company, feature: 'webhooks')).to be(true)
        expect(described_class.entitled?(company: pro_company, feature: 'custom_ctas')).to be(true)
      end
    end
  end

  describe '.limit, .usage and .remaining' do
    it 'correctly calculates limit, usage and remaining quota for metered features' do
      limit = described_class.limit(company: pro_company, feature: 'featured_products')
      expect(limit).to eq(10)

      usage = described_class.usage(company: pro_company, feature: 'featured_products')
      expect(usage).to eq(0)

      remaining = described_class.remaining(company: pro_company, feature: 'featured_products')
      expect(remaining).to eq(10)
    end
  end

  describe '.explain' do
    it 'provides a complete, explainable decision payload' do
      explanation = described_class.explain(company: pro_company, feature: 'premium_profile')

      expect(explanation[:feature]).to eq('premium_profile')
      expect(explanation[:allowed]).to be(true)
      expect(explanation[:plan]).to eq('pro')
      expect(explanation[:reason]).to eq('included_in_plan')
    end

    it 'produces valid JSON-safe output without Infinity or NaN for unlimited and boolean features' do
      explanation = described_class.explain(company: pro_company, feature: 'premium_profile')
      json_str = JSON.generate(explanation)

      expect(json_str).not_to include('Infinity')
      expect(json_str).not_to include('NaN')

      parsed = JSON.parse(json_str)
      expect(parsed['remaining']).to be_nil
      expect(parsed['limit']).to be_nil
      expect(parsed['allowed']).to be(true)
    end

    it 'handles zero limit and unlimited/null semantics correctly' do
      free_products = described_class.explain(company: free_company, feature: 'featured_products')
      expect(free_products[:limit]).to eq(0)
      expect(free_products[:remaining]).to eq(0)

      pro_unlimited = described_class.explain(company: pro_company, feature: 'product_description')
      expect(pro_unlimited[:limit]).to be_nil
      expect(pro_unlimited[:remaining]).to be_nil
    end
  end

  describe 'Quota & Tenant Isolation Scenarios' do
    it 'ensures quota usage of Company A does not consume Company B quota' do
      allow_any_instance_of(described_class).to receive(:usage).and_wrap_original do |m, key|
        m.receiver.instance_variable_get(:@company) == pro_company ? 5 : 0
      end

      rem_pro = described_class.remaining(company: pro_company, feature: 'featured_products')
      rem_free = described_class.remaining(company: free_company, feature: 'featured_products')

      expect(rem_pro).to eq(5)
      expect(rem_free).to eq(0)
    end

    it 'enforces quota exceed when usage > new quota after plan downgrade' do
      allow_any_instance_of(described_class).to receive(:usage).with('featured_products').and_return(12)

      explanation = described_class.explain(company: pro_company, feature: 'featured_products')
      expect(explanation[:usage]).to eq(12)
      expect(explanation[:limit]).to eq(10)
      expect(explanation[:remaining]).to eq(0)

      expect do
        described_class.enforce!(company: pro_company, feature: 'featured_products')
      end.to raise_error(EntitlementService::QuotaExceededError)
    end
  end

  describe '.enforce!' do
    it 'succeeds when company is entitled to feature' do
      expect(described_class.enforce!(company: pro_company, feature: 'premium_profile')).to be(true)
    end

    it 'raises NotEntitledError when company is not entitled' do
      expect do
        described_class.enforce!(company: free_company, feature: 'premium_profile')
      end.to raise_error(EntitlementService::NotEntitledError)
    end
  end
end
