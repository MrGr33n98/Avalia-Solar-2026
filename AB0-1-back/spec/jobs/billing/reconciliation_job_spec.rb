# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Billing::ReconciliationJob, type: :job do
  let!(:free_plan) { Plan.find_by(name: 'Free') || create(:plan, name: 'Free') }
  let(:company) { create(:company, plan: free_plan) }
  let(:plan) { Plan.find_by(name: 'Integration Plan') || create(:plan, name: 'Integration Plan', stripe_price_id_monthly: 'price_integration') }
  
  let!(:subscription) do
    Billing::CompanySubscription.create!(
      company: company,
      plan: plan,
      stripe_subscription_id: 'sub_rec_123',
      stripe_customer_id: 'cust_rec_123',
      status: 'active',
      current_period_start: 1.month.ago,
      current_period_end: Time.current
    )
  end

  before do
    allow(Analytics::TrackEventService).to receive(:call).and_return(true)
    allow(SlackNotificationService).to receive(:notify).and_return(true)
    allow(Billing::SlackNotifier).to receive(:alerts_enabled?).and_return(true)
    allow(Billing::SlackNotifier).to receive(:notify_new_subscription)
    allow(Billing::SlackNotifier).to receive(:notify_subscription_canceled)
    allow(Billing::SlackNotifier).to receive(:notify_payment_failed)
    allow(Billing::SlackNotifier).to receive(:notify_subscription_past_due)
  end

  describe '#perform' do
    context 'quando a assinatura está em perfeita sincronia' do
      before do
        allow(Stripe::Subscription).to receive(:retrieve).with('sub_rec_123').and_return(
          double(
            'Stripe::Subscription',
            status: 'active',
            current_period_end: subscription.current_period_end.to_i
          )
        )
      end

      it 'não dispara reconciliações e nem cria histórico de auditoria' do
        expect(Billing::SlackNotifier).not_to receive(:notify_reconciliation_divergence)
        
        expect {
          described_class.new.perform
        }.not_to change(Billing::AdminAction, :count)
      end
    end

    context 'quando há divergência de status' do
      let(:stripe_sub_divergent) do
        double(
          'Stripe::Subscription',
          id: 'sub_rec_123',
          customer: 'cust_rec_123',
          status: 'canceled', # DIVERGÊNCIA! Local é 'active'
          current_period_start: 1.month.ago.to_i,
          current_period_end: Time.current.to_i,
          cancel_at_period_end: false,
          trial_start: nil,
          trial_end: nil,
          canceled_at: Time.current.to_i,
          metadata: { 'company_id' => company.id.to_s },
          items: double('Stripe::SubscriptionItems', data: [
            double('Stripe::SubscriptionItem', price: double('Stripe::Price', id: 'price_integration'))
          ])
        )
      end

      before do
        allow(Stripe::Subscription).to receive(:retrieve).with('sub_rec_123').and_return(stripe_sub_divergent)
      end

      it 'envia alerta de divergência para o Slack, auto-sincroniza e audita a ação' do
        expect(Billing::SlackNotifier).to receive(:notify_reconciliation_divergence).with(
          company: company,
          local_status: 'active',
          local_period_end: subscription.current_period_end,
          stripe_status: 'canceled',
          stripe_period_end: anything
        )

        expect {
          described_class.new.perform
        }.to change(Billing::AdminAction, :count).by(1)

        subscription.reload
        expect(subscription.status).to eq('canceled')

        audit = Billing::AdminAction.last
        expect(audit.action_type).to eq('sync_stripe')
        expect(audit.admin_user_id).to be_present # Ação automática do sistema
      end
    end
  end
end
