require 'rails_helper'

RSpec.describe Payment::CheckoutService do
  let(:company) { create(:company) }
  let(:banner) { create(:banner, company: company) }
  let(:addon) do
    create(:banner_addon, name: 'Destaque', price_cents: 10_000, promotional_price_cents: 8_000)
  end
  let(:subscription) do
    BannerAddonSubscription.new(
      company: company,
      banner: banner,
      banner_addon: addon,
      price_paid_cents: 8_000,
      payment_provider: 'stripe',
      checkout_session_id: 'PAY-TESTE'
    )
  end

  it 'aceita assinatura de add-on sem acessar banner_offer' do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('STRIPE_SECRET_KEY').and_return(nil)

    url = described_class.new(subscription).create_checkout_session('stripe')

    expect(url).to start_with('https://checkout.stripe.com/pay/mock_')
  end

  it 'envia preço efetivamente pago ao Stripe' do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('STRIPE_SECRET_KEY').and_return('sk_test')
    allow(Stripe::Checkout::Session).to receive(:create).and_return(double(url: 'https://checkout.test/session'))

    described_class.new(subscription).create_checkout_session('stripe')

    expect(Stripe::Checkout::Session).to have_received(:create).with(
      hash_including(line_items: [hash_including(price_data: hash_including(unit_amount: 8_000))])
    )
  end
end
