# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin Banner Addon Subscriptions', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.find_or_create_by!(email: 'admin-banner-addon@example.com') do |admin|
      admin.password = 'password123'
      admin.password_confirmation = 'password123'
    end
  end

  let(:user) { create(:user) }
  let(:company) { create(:company) }
  let(:banner) { create(:banner, company: company) }
  let(:banner_addon) { create(:banner_addon) }
  let(:subscription) do
    create(:banner_addon_subscription,
      company: company,
      banner: banner,
      banner_addon: banner_addon,
      status: 'active',
      ends_at: 1.day.from_now
    )
  end

  before do
    BannerAddonSubscription.destroy_all
    unless BannerAddons::LifecycleService.respond_to?(:extend_subscription)
      BannerAddons::LifecycleService.define_singleton_method(:extend_subscription) { |sub, days| }
    end
    sign_in admin_user
  end

  describe 'PUT /admin/banner_addon_subscriptions/:id/extend_period' do
    it 'extends the subscription by 7 days' do
      expect(BannerAddons::LifecycleService).to receive(:extend_subscription).with(anything, 7)

      put extend_period_admin_banner_addon_subscription_path(subscription)

      expect(response).to redirect_to(admin_banner_addon_subscription_path(subscription))
      expect(flash[:notice]).to eq('Contratação estendida por 7 dias.')
    end
  end
end
