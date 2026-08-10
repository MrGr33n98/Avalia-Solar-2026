# frozen_string_literal: true

require "rails_helper"

RSpec.describe Webhooks::StripeHandler do
  let(:company) { create(:company) }
  let(:banner) { create(:banner, :approved, active: true, company: company, sponsored: true) }
  let(:addon) { create(:banner_addon) }
  let!(:subscription) do
    create(:banner_addon_subscription, company: company, banner: banner, banner_addon: addon,
           status: 'pending_payment', starts_at: nil, ends_at: nil, checkout_session_id: 'checkout-123')
  end
  let(:object) { OpenStruct.new(client_reference_id: 'checkout-123', payment_intent: 'pi-123') }
  let(:event) do
    OpenStruct.new(
      id: "evt-banner-#{subscription.id}-#{Process.pid}",
      type: 'checkout.session.completed',
      data: OpenStruct.new(object: object),
      as_json: { 'id' => "evt-banner-#{subscription.id}-#{Process.pid}", 'type' => 'checkout.session.completed' }
    )
  end

  around do |example|
    previous_secret = ENV['STRIPE_WEBHOOK_SECRET']
    ENV['STRIPE_WEBHOOK_SECRET'] = 'secret'
    example.run
  ensure
    ENV['STRIPE_WEBHOOK_SECRET'] = previous_secret
  end

  before do
    allow(Stripe::Webhook).to receive(:construct_event).and_return(event)
  end

  it 'ativa add-on pago e registra referência do pagamento' do
    described_class.new('{}', 'sig').call

    expect(subscription.reload).to have_attributes(
      status: 'active',
      payment_reference: 'pi-123',
      payment_provider: 'stripe'
    )
    expect(PaymentWebhookEvent.find_by(provider: 'stripe', provider_event_id: event.id).status).to eq('processed')
  end

  it 'é idempotente quando o mesmo evento chega novamente' do
    handler = described_class.new('{}', 'sig')
    handler.call
    activated_at = subscription.reload.activated_at
    handler.call

    expect(subscription.reload.activated_at).to eq(activated_at)
    expect(PaymentWebhookEvent.where(provider: 'stripe', provider_event_id: event.id).count).to eq(1)
  end
end
