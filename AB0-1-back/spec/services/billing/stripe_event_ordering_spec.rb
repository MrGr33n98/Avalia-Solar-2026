# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Billing::StripeWebhookHandler Event Ordering & Concurrency (Wave 2C)', type: :service do
  self.use_transactional_tests = false

  let!(:pro_plan) { Plan.find_by(stripe_price_id_monthly: 'price_pro_123') || create(:plan, name: 'Pro Stripe', stripe_price_id_monthly: 'price_pro_123') }
  let!(:enterprise_plan) { Plan.find_by(stripe_price_id_monthly: 'price_ent_456') || create(:plan, name: 'Enterprise Stripe', stripe_price_id_monthly: 'price_ent_456') }
  let!(:free_plan) { Plan.find_by(name: 'Free') || create(:plan, name: 'Free', stripe_price_id_monthly: 'price_free') }
  let!(:company) { create(:company, name: 'Empresa Stripe Ordering', plan: pro_plan) }
  let(:signature) { 'mock_sig' }

  before(:each) do
    allow(Analytics::TrackEventService).to receive(:call).and_return(true)
    allow(SlackNotificationService).to receive(:notify).and_return(true)
    allow(Billing::SlackNotifier).to receive(:alerts_enabled?).and_return(true)
    Billing::CompanySubscription.where(company: company).destroy_all rescue nil
    Billing::CompanySubscription.where("stripe_subscription_id LIKE 'sub_%'").destroy_all rescue nil
    Billing::StripeEvent.where("stripe_event_id LIKE 'evt_%'").destroy_all rescue nil
    company.update!(plan: pro_plan)
  end

  after(:all) do
    Billing::CompanySubscription.where(company: company).destroy_all rescue nil
    Billing::CompanySubscription.where("stripe_subscription_id LIKE 'sub_%'").destroy_all rescue nil
    Billing::StripeEvent.where("stripe_event_id LIKE 'evt_%'").destroy_all rescue nil
    Company.where(name: 'Empresa Stripe Ordering').destroy_all rescue nil
    Plan.where(name: ['Pro Stripe', 'Enterprise Stripe']).destroy_all rescue nil
  end

  def build_subscription_payload(event_id:, sub_id:, status:, price_id:, created_ts:, cust_id: nil)
    customer_id = cust_id || "cust_#{sub_id}"
    {
      id: event_id,
      created: created_ts,
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: sub_id,
          customer: customer_id,
          status: status,
          current_period_start: created_ts,
          current_period_end: created_ts + 30.days.to_i,
          cancel_at_period_end: false,
          trial_start: nil,
          trial_end: nil,
          canceled_at: (status == 'canceled' ? created_ts : nil),
          metadata: { 'company_id' => company.id.to_s },
          items: {
            data: [
              { price: { id: price_id } }
            ]
          }
        }
      }
    }.to_json
  end

  describe '1. Duplicate Event Idempotency' do
    it 'processes first delivery and returns :duplicate on subsequent delivery with 0 extra side effects' do
      payload = build_subscription_payload(
        event_id: 'evt_dup_1',
        sub_id: 'sub_dup_1',
        status: 'active',
        price_id: 'price_pro_123',
        created_ts: 1_700_000_100
      )

      # 1st delivery
      result1 = Billing::StripeWebhookHandler.new(payload: payload, signature: signature).call
      expect(result1).to eq(:success)

      event_record = Billing::StripeEvent.find_by(stripe_event_id: 'evt_dup_1')
      expect(event_record.processing_status).to eq('success')

      # 2nd delivery (duplicate)
      expect {
        result2 = Billing::StripeWebhookHandler.new(payload: payload, signature: signature).call
        expect(result2).to eq(:duplicate)
      }.not_to change(Billing::StripeEvent, :count)

      expect(Billing::CompanySubscription.where(stripe_subscription_id: 'sub_dup_1').count).to eq(1)
    end
  end

  describe '2. Out-of-Order / Stale Event Rejection (Monotonic Subscription Protection)' do
    it 'ignores older event arriving after a newer event, preventing subscription state regression' do
      # Event 2 (newer: created at t=200, upgrades to Enterprise)
      newer_payload = build_subscription_payload(
        event_id: 'evt_newer_200',
        sub_id: 'sub_order_seq',
        status: 'active',
        price_id: 'price_ent_456',
        created_ts: 1_700_000_200
      )

      # Event 1 (older: created at t=100, downgrades to canceled/free)
      older_payload = build_subscription_payload(
        event_id: 'evt_older_100',
        sub_id: 'sub_order_seq',
        status: 'canceled',
        price_id: 'price_pro_123',
        created_ts: 1_700_000_100
      )

      # Newer event arrives first
      result_newer = Billing::StripeWebhookHandler.new(payload: newer_payload, signature: signature).call
      expect(result_newer).to eq(:success)

      subscription = Billing::CompanySubscription.find_by(stripe_subscription_id: 'sub_order_seq')
      expect(subscription.status).to eq('active')
      expect(subscription.plan).to eq(enterprise_plan)
      expect(company.reload.plan).to eq(enterprise_plan)

      # Older event arrives delayed
      result_older = Billing::StripeWebhookHandler.new(payload: older_payload, signature: signature).call
      expect(result_older).to eq(:skipped_stale)

      older_event_record = Billing::StripeEvent.find_by(stripe_event_id: 'evt_older_100')
      expect(older_event_record.processing_status).to eq('skipped_stale')

      # Canonical state remains protected at newer state (Enterprise, active)
      subscription.reload
      expect(subscription.status).to eq('active')
      expect(subscription.plan).to eq(enterprise_plan)
      expect(company.reload.plan).to eq(enterprise_plan)
    end
  end

  describe '3. Same-Timestamp Handling' do
    it 'handles events with the same timestamp safely without unhandled exceptions' do
      payload_a = build_subscription_payload(
        event_id: 'evt_same_ts_a',
        sub_id: 'sub_same_ts',
        status: 'active',
        price_id: 'price_pro_123',
        created_ts: 1_700_000_500
      )

      payload_b = build_subscription_payload(
        event_id: 'evt_same_ts_b',
        sub_id: 'sub_same_ts',
        status: 'active',
        price_id: 'price_pro_123',
        created_ts: 1_700_000_500
      )

      res_a = Billing::StripeWebhookHandler.new(payload: payload_a, signature: signature).call
      expect(res_a).to eq(:success)

      res_b = Billing::StripeWebhookHandler.new(payload: payload_b, signature: signature).call
      expect([:success, :skipped_stale, :duplicate]).to include(res_b)
    end
  end

  describe '4. Concurrent Webhook Deliveries for Same Subscription' do
    it 'executes with row lock so that concurrent webhook events execute monotonically without deadlocks' do
      # Initial subscription
      init_payload = build_subscription_payload(
        event_id: 'evt_init_conc',
        sub_id: 'sub_conc_test',
        status: 'active',
        price_id: 'price_pro_123',
        created_ts: 1_700_000_010
      )
      Billing::StripeWebhookHandler.new(payload: init_payload, signature: signature).call

      payload_1 = build_subscription_payload(
        event_id: 'evt_conc_1',
        sub_id: 'sub_conc_test',
        status: 'active',
        price_id: 'price_ent_456',
        created_ts: 1_700_000_050
      )

      payload_2 = build_subscription_payload(
        event_id: 'evt_conc_2',
        sub_id: 'sub_conc_test',
        status: 'past_due',
        price_id: 'price_pro_123',
        created_ts: 1_700_000_030
      )

      barrier = Concurrent::CyclicBarrier.new(2)
      results = []

      t1 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          res = Billing::StripeWebhookHandler.new(payload: payload_1, signature: signature).call
          results << { thread: 1, res: res }
        end
      end

      t2 = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait
          res = Billing::StripeWebhookHandler.new(payload: payload_2, signature: signature).call
          results << { thread: 2, res: res }
        end
      end

      [t1, t2].each(&:join)

      expect(results.size).to eq(2)
      # Newer state (created: 1_700_000_050, price_ent_456) must be final or active
      sub = Billing::CompanySubscription.find_by(stripe_subscription_id: 'sub_conc_test')
      expect(sub.plan).to eq(enterprise_plan)
      expect(company.reload.plan).to eq(enterprise_plan)
    end
  end

  describe '5. Zero Synchronous Stripe Calls on Feature / Quota Hot-Path' do
    it 'confirms EntitlementService and webhook processing do NOT perform any outbound Stripe API requests' do
      expect(Stripe::Subscription).not_to receive(:retrieve)
      expect(Stripe::Customer).not_to receive(:retrieve)

      # Hot-path entitlement check
      EntitlementService.entitled?(company: company, feature: 'featured_products')
      EntitlementService.limit(company: company, feature: 'featured_products')
      EntitlementService.usage(company: company, feature: 'featured_products')
      EntitlementService.explain(company: company, feature: 'featured_products')

      # Atomic quota check
      EntitlementService.with_quota_lock(company: company, feature: 'featured_products') do
        # no-op
      end
    end
  end
end
