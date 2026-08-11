require 'rails_helper'

RSpec.describe BillingAdminOverviewQuery, type: :service do
  let!(:public_plan) { create(:plan, name: 'Public Billing Query Plan', price: 100.0, is_public: true) }
  let!(:private_plan) { create(:plan, name: 'Private Billing Query Plan', price: 999.0, is_public: false) }
  let!(:active_company) { create(:company, plan: public_plan) }
  let!(:trial_company) { create(:company, plan: public_plan) }
  let!(:past_due_company) { create(:company, plan: public_plan) }
  let!(:canceled_company) { create(:company, plan: public_plan) }
  let!(:orphan_company) { create(:company) }

  before do
    Billing::CompanySubscription.create!(company: active_company, plan: public_plan, status: 'active')
    Billing::CompanySubscription.create!(company: trial_company, plan: public_plan, status: 'trialing')
    Billing::CompanySubscription.create!(company: past_due_company, plan: public_plan, status: 'past_due', cancel_at_period_end: true)
    Billing::CompanySubscription.create!(company: canceled_company, plan: public_plan, status: 'canceled')
    SubscriptionPlan.create!(member: nil, product: create(:product), category: create(:category), plan: public_plan,
                             status: 'active', value: 100)
  end

  it 'retorna KPIs usando fontes canônicas de billing' do
    result = described_class.new.call

    expect(result[:public_plans]).to eq(1)
    expect(result[:active_subscriptions]).to eq(3)
    expect(result[:trials]).to eq(1)
    expect(result[:past_due]).to eq(1)
    expect(result[:scheduled_cancellations]).to eq(1)
    expect(result[:companies_without_subscription]).to be >= 1
    expect(result[:legacy_subscriptions]).to eq(1)
    expect(result[:feature_count]).to eq(PlanFeatureCatalog.known_keys.size)
    expect(result[:mrr_amount]).to eq(300.0)
  end
end
