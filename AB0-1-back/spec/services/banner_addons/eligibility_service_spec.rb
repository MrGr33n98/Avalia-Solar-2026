require 'rails_helper'

RSpec.describe BannerAddons::EligibilityService do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:banner) { create(:banner, company: company) }
  let(:addon) { create(:banner_addon, is_active: true, price_cents: 10000, duration_days: 30) }

  subject { described_class.new(company: company, banner: banner, addon: addon) }

  describe '#call' do
    context 'when eligible' do
      it 'returns eligible true with effective price' do
        result = subject.call
        expect(result[:eligible]).to be true
        expect(result[:effective_price_cents]).to eq(10000)
        expect(result[:error]).to be_nil
      end
    end

    context 'when addon is not active' do
      before { addon.update!(is_active: false) }

      it 'returns error addon_not_active' do
        result = subject.call
        expect(result[:eligible]).to be false
        expect(result[:error]).to eq('addon_not_active')
      end
    end

    context 'when banner does not belong to company' do
      subject { described_class.new(company: other_company, banner: banner, addon: addon) }

      it 'returns error banner_does_not_belong_to_company' do
        result = subject.call
        expect(result[:eligible]).to be false
        expect(result[:error]).to eq('banner_does_not_belong_to_company')
      end
    end

    context 'when banner already has an active subscription for this addon' do
      before do
        BannerAddonSubscription.create!(
          company: company,
          banner: banner,
          banner_addon: addon,
          price_paid_cents: 10000,
          status: 'active',
          starts_at: Time.current,
          ends_at: Time.current + 30.days
        )
      end

      it 'returns error addon_already_active_for_banner' do
        result = subject.call
        expect(result[:eligible]).to be false
        expect(result[:error]).to eq('addon_already_active_for_banner')
      end
    end
  end
end
