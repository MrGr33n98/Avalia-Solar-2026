# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::CampaignPolicy, type: :policy do
  let(:company_a) { create(:company) }
  let(:company_b) { create(:company) }

  let(:user_a) { create(:user, company: company_a) }
  let(:user_b) { create(:user, company: company_b) }
  let(:admin_user) { create(:user, role: 'admin') }

  let(:campaign_a) { create(:sales_campaign, company: company_a, user: user_a) }
  let(:tenant_actions) do
    %i[
      show? update? dispatch? launch? pause? resume? cancel? retry_failed? snapshot? schedule?
      preflight? analytics? recipients? activity?
    ]
  end

  describe 'tenant scoped actions' do
    it 'grants access to user belonging to same tenant' do
      policy = described_class.new(user_a, campaign_a)
      tenant_actions.each do |action|
        expect(policy.public_send(action)).to be(true)
      end
    end

    it 'denies access to user belonging to different tenant' do
      policy = described_class.new(user_b, campaign_a)
      tenant_actions.each do |action|
        expect(policy.public_send(action)).to be(false)
      end
    end

    it 'grants access to admin user' do
      policy = described_class.new(admin_user, campaign_a)
      tenant_actions.each do |action|
        expect(policy.public_send(action)).to be(true)
      end
    end
  end

  describe '#destroy?' do
    it 'grants access to tenant user or admin' do
      expect(described_class.new(user_a, campaign_a).destroy?).to be(true)
      expect(described_class.new(admin_user, campaign_a).destroy?).to be(true)
    end

    it 'denies access to different tenant user' do
      expect(described_class.new(user_b, campaign_a).destroy?).to be(false)
    end
  end
end
