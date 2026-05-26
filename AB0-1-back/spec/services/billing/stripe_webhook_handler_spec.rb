# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Billing::StripeWebhookHandler, type: :service do
  let(:plan) { Plan.find_by(name: 'Integration Plan') || create(:plan, name: 'Integration Plan', stripe_price_id_monthly: 'price_integration') }
  let(:free_plan) { Plan.find_by(name: 'Free') || create(:plan, name: 'Free', stripe_price_id_monthly: 'price_free') }
  let(:company) { create(:company, plan: free_plan) }

  before do
    allow(Analytics::TrackEventService).to receive(:call).and_return(true)
    allow(SlackNotificationService).to receive(:notify).and_return(true)
    allow(Billing::SlackNotifier).to receive(:alerts_enabled?).and_return(true)
  end

  let(:signature) { 'mock_sig' }

  describe '#call' do
    context 'com um evento de assinatura criado' do
      let(:payload) do
        {
          id: 'evt_created_123',
          type: 'customer.subscription.created',
          data: {
            object: {
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
              items: {
                data: [
                  { price: { id: 'price_integration' } }
                ]
              }
            }
          }
        }.to_json
      end

      it 'sincroniza a assinatura com sucesso e registra no histórico de eventos' do
        expect(Billing::SlackNotifier).to receive(:notify_new_subscription).with(company: company, plan: plan)

        expect {
          described_class.new(payload: payload, signature: signature).call
        }.to change(Billing::StripeEvent, :count).by(1)

        event = Billing::StripeEvent.last
        expect(event.stripe_event_id).to eq('evt_created_123')
        expect(event.processing_status).to eq('success')

        company.reload
        expect(company.plan_id).to eq(plan.id)
      end

      it 'implementa idempotência rígida ao reprocessar o mesmo ID' do
        # Processa a primeira vez
        described_class.new(payload: payload, signature: signature).call

        # Processa a segunda vez
        expect {
          result = described_class.new(payload: payload, signature: signature).call
          expect(result).to eq(:duplicate)
        }.not_to change(Billing::StripeEvent, :count)
      end
    end

    context 'com um evento de falha de pagamento' do
      let!(:subscription) do
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

      let(:payload) do
        {
          id: 'evt_failed_123',
          type: 'invoice.payment_failed',
          data: {
            object: {
              id: 'in_failed_123',
              customer: 'cust_test_123',
              subscription: 'sub_test_123',
              amount_due: 29700,
              attempt_count: 2,
              charge_failure_code: 'insufficient_funds',
              last_payment_error: { message: 'Card declined due to insufficient funds' }
            }
          }
        }.to_json
      end

      it 'notifica a falha de pagamento de forma síncrona' do
        expect(Billing::SlackNotifier).to receive(:notify_payment_failed).with(
          company: company,
          amount_cents: 29700,
          decline_reason: 'insufficient_funds',
          attempt_count: 2
        )

        described_class.new(payload: payload, signature: signature).call

        subscription.reload
        expect(subscription.last_payment_error).to eq('Card declined due to insufficient funds')
        expect(subscription.last_payment_error_at).to be_present
      end
    end

    context 'com assinatura de webhook inválida' do
      let(:payload) { { id: 'evt_bad', type: 'customer.subscription.created' }.to_json }

      before do
        allow(Stripe::Webhook).to receive(:construct_event).and_raise(Stripe::SignatureVerificationError.new('Bad signature', 'sig'))
      end

      it 'lança InvalidWebhookSignature e envia alerta técnico' do
        # Garante que não usamos a assinatura de mock
        expect(Billing::SlackNotifier).to receive(:notify_invalid_webhook).with(error: 'Bad signature')

        expect {
          described_class.new(payload: payload, signature: 'bad_sig').call
        }.to raise_error(::Billing::Errors::InvalidWebhookSignature)
      end
    end
  end
end
