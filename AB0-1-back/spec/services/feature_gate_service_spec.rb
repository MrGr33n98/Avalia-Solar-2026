# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FeatureGateService do
  describe '.can_access?' do
    context 'when company is nil' do
      it 'returns true (safe fallback)' do
        expect(described_class.can_access?(nil, 'any_feature')).to be(true)
      end
    end

    context 'for a free company' do
      let(:plan) { create(:plan, name: 'Free', price: 0) }
      let(:company) { create(:company, plan: plan) }

      it 'allows access to view_dashboard' do
        expect(described_class.can_access?(company, 'view_dashboard')).to be(true)
      end

      it 'allows access to basic_analytics' do
        expect(described_class.can_access?(company, 'basic_analytics')).to be(true)
      end

      it 'denies access to advanced_analytics' do
        expect(described_class.can_access?(company, 'advanced_analytics')).to be(false)
      end

      it 'denies access to top_campaigns' do
        expect(described_class.can_access?(company, 'top_campaigns')).to be(false)
      end

      it 'denies access to reputation_tracking' do
        expect(described_class.can_access?(company, 'reputation_tracking')).to be(false)
      end

      it 'denies access to api_access' do
        expect(described_class.can_access?(company, 'api_access')).to be(false)
      end
    end

    context 'for a pro company' do
      let(:plan) { create(:plan, name: 'Pro', price: 99.0) }
      let(:company) { create(:company, plan: plan) }

      before do
        # Mock the plan tier to be 'pro'
        allow(plan).to receive(:tier).and_return('pro')
        allow(plan).to receive(:plan_tier).and_return('pro')
      end

      it 'allows access to view_dashboard' do
        expect(described_class.can_access?(company, 'view_dashboard')).to be(true)
      end

      it 'allows access to advanced_analytics' do
        expect(described_class.can_access?(company, 'advanced_analytics')).to be(true)
      end

      it 'allows access to top_campaigns' do
        expect(described_class.can_access?(company, 'top_campaigns')).to be(true)
      end

      it 'allows access to reputation_tracking' do
        expect(described_class.can_access?(company, 'reputation_tracking')).to be(true)
      end

      it 'denies access to api_access (enterprise only)' do
        expect(described_class.can_access?(company, 'api_access')).to be(false)
      end
    end

    context 'for an enterprise company' do
      let(:plan) { create(:plan, name: 'Enterprise', price: 499.0) }
      let(:company) { create(:company, plan: plan) }

      before do
        # Mock the plan tier to be 'enterprise'
        allow(plan).to receive(:tier).and_return('enterprise')
        allow(plan).to receive(:plan_tier).and_return('enterprise')
      end

      it 'allows access to view_dashboard' do
        expect(described_class.can_access?(company, 'view_dashboard')).to be(true)
      end

      it 'allows access to advanced_analytics' do
        expect(described_class.can_access?(company, 'advanced_analytics')).to be(true)
      end

      it 'allows access to api_access' do
        expect(described_class.can_access?(company, 'api_access')).to be(true)
      end

      it 'allows access to webhooks' do
        expect(described_class.can_access?(company, 'webhooks')).to be(true)
      end

      it 'allows access to white_label_support' do
        expect(described_class.can_access?(company, 'white_label_support')).to be(true)
      end
    end
  end

  describe '.accessible_features' do
    context 'when company is nil' do
      it 'returns empty array' do
        expect(described_class.accessible_features(nil)).to eq([])
      end
    end

    context 'for a free company' do
      let(:plan) { create(:plan, name: 'Free', price: 0) }
      let(:company) { create(:company, plan: plan) }

      it 'returns only free tier features' do
        features = described_class.accessible_features(company)
        expect(features).to include('view_dashboard', 'basic_analytics')
        expect(features).to_not include('advanced_analytics', 'api_access')
      end
    end

    context 'for a pro company' do
      let(:plan) { create(:plan, name: 'Pro', price: 99.0) }
      let(:company) { create(:company, plan: plan) }

      before do
        allow(plan).to receive(:tier).and_return('pro')
        allow(plan).to receive(:plan_tier).and_return('pro')
      end

      it 'returns pro tier features' do
        features = described_class.accessible_features(company)
        expect(features).to include('view_dashboard', 'basic_analytics', 'advanced_analytics', 'top_campaigns')
        expect(features).to_not include('api_access')
      end
    end

    context 'for an enterprise company' do
      let(:plan) { create(:plan, name: 'Enterprise', price: 499.0) }
      let(:company) { create(:company, plan: plan) }

      before do
        allow(plan).to receive(:tier).and_return('enterprise')
        allow(plan).to receive(:plan_tier).and_return('enterprise')
      end

      it 'returns all enterprise features' do
        features = described_class.accessible_features(company)
        expect(features).to include('api_access', 'webhooks', 'white_label_support', 'priority_support')
      end
    end
  end
end
