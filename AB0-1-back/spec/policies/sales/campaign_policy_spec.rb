# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::CampaignPolicy, type: :policy do
  subject { described_class }

  let(:company_a) { create(:company) }
  let(:company_b) { create(:company) }

  let(:user_a) { create(:user, company: company_a) }
  let(:user_b) { create(:user, company: company_b) }
  let(:admin_user) { create(:user, :admin) }

  let(:campaign_a) { create(:sales_campaign, company: company_a, user: user_a) }

  permissions :show?, :update?, :dispatch?, :launch?, :pause?, :resume?, :cancel?, :retry_failed?, :snapshot?, :schedule?, :preflight?, :analytics?, :recipients?, :activity? do
    it 'grants access to user belonging to same tenant' do
      expect(subject).to permit(user_a, campaign_a)
    end

    it 'denies access to user belonging to different tenant' do
      expect(subject).not_to permit(user_b, campaign_a)
    end

    it 'grants access to admin user' do
      expect(subject).to permit(admin_user, campaign_a)
    end
  end

  permissions :destroy? do
    it 'grants access to tenant user or admin' do
      expect(subject).to permit(user_a, campaign_a)
      expect(subject).to permit(admin_user, campaign_a)
    end

    it 'denies access to different tenant user' do
      expect(subject).not_to permit(user_b, campaign_a)
    end
  end
end
