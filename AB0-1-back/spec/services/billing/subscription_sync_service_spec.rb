# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Billing::SubscriptionSyncService, type: :service do
  let(:plan) { Plan.find_by(name: 'Integration Plan') || create(:plan, name: 'Integration Plan', stripe_price_id_monthly: 'price_integration') }
  let(:free_plan) { Plan.find_by(name: 'Free') || create(:plan, name: 'Free', stripe_price_id_monthly: 'price_free') }
  let(:company) { create(:company, plan: free_plan) }

  before do
    allow(Analytics::TrackEventService).to receive(:call).and_return(true)
    allow(SlackNotificationService).to receive(:notify).and_return(true)
    allow(Billing::SlackNotifier).to receive(:alerts_enabled?).and_return(true)
  end

  let(:stripe_subscription_mock) do
    double(
      'Stripe::Subscription',
      id: 'sub_test_123',
      customer: 'cust_test_123',
      status: 'active',
      current_period_start: Time.current.to_i,
      current_period_end: 1.month.from_now.to_i,
      cancel_at_period_end: false,
      trial_start: nil,
      trial_end: nil,
      canceled_at: nil,
      metadata: { 'company_id' => company.id.to_s },
      items: double('Stripe::SubscriptionItems', data: [
        double('Stripe::SubscriptionItem', price: double('Stripe::Price', id: 'price_integration'))
      ])
    )
  end

  describe '#call' do
    context 'quando a assinatura não existe localmente' do
      it 'cria uma nova CompanySubscription e atualiza o plano da empresa' do
        expect(Billing::SlackNotifier).to receive(:notify_new_subscription).with(company: company, plan: plan)

        expect {
          described_class.new(stripe_subscription_mock).call
        }.to change(Billing::CompanySubscription, :count).by(1)

        sub = Billing::CompanySubscription.find_by(stripe_subscription_id: 'sub_test_123')
        expect(sub).to be_present
        expect(sub.status).to eq('active')
        expect(sub.stripe_customer_id).to eq('cust_test_123')
        
        company.reload
        expect(company.plan_id).to eq(plan.id)
      end
    end

    context 'quando a assinatura já existe localmente' do
      let!(:existing_sub) do
        Billing::CompanySubscription.create!(
          company: company,
          plan: plan,
          stripe_subscription_id: 'sub_test_123',
          stripe_customer_id: 'cust_test_123',
          status: 'trialing',
          current_period_start: 1.month.ago,
          current_period_end: Time.current
        )
      end

      it 'atualiza a CompanySubscription existente sem criar uma nova' do
        # Não deve disparar notify_new_subscription se já era active/trialing (ambos são ativos)
        # Mas vamos testar a sincronização
        expect {
          described_class.new(stripe_subscription_mock).call
        }.not_to change(Billing::CompanySubscription, :count)

        existing_sub.reload
        expect(existing_sub.status).to eq('active')
        
        company.reload
        expect(company.plan_id).to eq(plan.id)
      end
    end

    context 'quando a assinatura é deletada/cancelada' do
      let!(:existing_sub) do
        Billing::CompanySubscription.create!(
          company: company,
          plan: plan,
          stripe_subscription_id: 'sub_test_123',
          stripe_customer_id: 'cust_test_123',
          status: 'active',
          current_period_start: 1.month.ago,
          current_period_end: Time.current
        )
      end

      it 'reverte o plano da empresa para o plano Free e notifica cancelamento' do
        expect(Billing::SlackNotifier).to receive(:notify_subscription_canceled).with(
          company: company,
          plan: plan,
          reason: 'Stripe webhook subscription cancellation',
          period_end: anything
        )

        described_class.new(stripe_subscription_mock, deleted: true).call

        existing_sub.reload
        expect(existing_sub.status).to eq('canceled')
        
        company.reload
        expect(company.plan_id).to eq(free_plan.id)
      end
    end
  end
end
