require 'rails_helper'

RSpec.describe Banners::CompanyBannerQuotaService do
  let(:company) { create(:company) }
  let(:banners) { class_double('Banner') }

  before do
    allow(company).to receive(:banners).and_return(banners)
    allow(banners).to receive(:where).with(active: true, moderation_status: 'approved').and_return(banners)
  end

  describe '#call' do
    context 'when promo_banner feature is disabled' do
      before do
        allow(company).to receive(:feature_access).and_return(
          { 'promo_banner' => { 'state' => 'locked' } }
        )
        allow(banners).to receive(:count).and_return(2)
      end

      it 'returns limit 0 and can_create false' do
        result = described_class.call(company)

        expect(result[:limit]).to eq(0)
        expect(result[:used]).to eq(2)
        expect(result[:remaining]).to eq(0)
        expect(result[:can_create]).to eq(false)
      end
    end

    context 'when promo_banner feature is enabled' do
      before do
        allow(company).to receive(:feature_access).and_return(
          { 'promo_banner' => { 'state' => 'enabled' } }
        )
      end

      context 'and plan has explicit banner_limit' do
        before do
          allow(company).to receive(:feature_value_from_plan).with('max_banners', 'banner_limit').and_return(5)
          allow(banners).to receive(:count).and_return(2)
        end

        it 'uses the explicit limit' do
          result = described_class.call(company)

          expect(result[:limit]).to eq(5)
          expect(result[:used]).to eq(2)
          expect(result[:remaining]).to eq(3)
          expect(result[:can_create]).to eq(true)
        end
      end

      context 'and plan has unlimited limit' do
        before do
          allow(company).to receive(:feature_value_from_plan).with('max_banners', 'banner_limit').and_return('unlimited')
          allow(banners).to receive(:count).and_return(10)
        end

        it 'returns nil for limit and remaining' do
          result = described_class.call(company)

          expect(result[:limit]).to be_nil
          expect(result[:used]).to eq(10)
          expect(result[:remaining]).to be_nil
          expect(result[:can_create]).to eq(true)
        end
      end

      context 'and plan has no explicit limit (fallback behavior)' do
        before do
          allow(company).to receive(:feature_value_from_plan).with('max_banners', 'banner_limit').and_return(nil)
        end

        it 'uses 3 for pro tier' do
          allow(company).to receive(:inferred_plan_tier).and_return('pro')
          allow(banners).to receive(:count).and_return(1)
          
          result = described_class.call(company)
          expect(result[:limit]).to eq(3)
          expect(result[:remaining]).to eq(2)
        end

        it 'uses nil (unlimited) for enterprise tier' do
          allow(company).to receive(:inferred_plan_tier).and_return('enterprise')
          allow(banners).to receive(:count).and_return(5)
          
          result = described_class.call(company)
          expect(result[:limit]).to be_nil
          expect(result[:remaining]).to be_nil
        end

        it 'uses 1 for other tiers' do
          allow(company).to receive(:inferred_plan_tier).and_return('essential')
          allow(banners).to receive(:count).and_return(1)
          
          result = described_class.call(company)
          expect(result[:limit]).to eq(1)
          expect(result[:remaining]).to eq(0)
          expect(result[:can_create]).to eq(false)
        end
      end

      context 'when used exceeds limit' do
        before do
          allow(company).to receive(:feature_value_from_plan).with('max_banners', 'banner_limit').and_return(2)
          allow(banners).to receive(:count).and_return(3) # e.g. downgraded plan
        end

        it 'returns 0 remaining and false can_create' do
          result = described_class.call(company)
          expect(result[:limit]).to eq(2)
          expect(result[:used]).to eq(3)
          expect(result[:remaining]).to eq(0)
          expect(result[:can_create]).to eq(false)
        end
      end
    end
  end
end
