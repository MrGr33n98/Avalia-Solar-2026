# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Aliases de atributos do Active Admin' do
  it 'mantém leitura e escrita de price em Pricing' do
    pricing = Pricing.new(price: 199.90)

    expect(pricing.value).to eq(BigDecimal('199.90'))
    expect(pricing.price).to eq(pricing.value)
  end

  it 'mantém leitura e escrita de active em BannerAddon' do
    addon = BannerAddon.new(active: false)

    expect(addon.is_active).to be(false)
    expect(addon.active).to be(false)
  end

  it 'mantém leitura e escrita de payment_gateway em BannerAddonSubscription' do
    subscription = BannerAddonSubscription.new(payment_gateway: 'stripe')

    expect(subscription.payment_provider).to eq('stripe')
    expect(subscription.payment_gateway).to eq('stripe')
  end
end
