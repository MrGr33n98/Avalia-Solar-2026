# frozen_string_literal: true

FactoryBot.define do
  factory :banner_addon do
    sequence(:name) { |number| "Add-on #{number}" }
    sequence(:code) { |number| "addon_#{number}" }
    description { 'Destaque adicional para banner patrocinado.' }
    price_cents { 10_000 }
    promotional_price_cents { nil }
    currency { 'BRL' }
    duration_days { 30 }
    category { 'visibility' }
    benefits { ['Mais alcance'] }
    rules { {} }
    is_active { true }
    stackable { false }
    automatic_application { false }
    priority_boost { 10 }
  end

  factory :banner_addon_subscription do
    association :company
    association :banner
    association :banner_addon
    transient do
      price_cents { 10_000 }
    end
    price_paid_cents { price_cents }
    discount_cents { 0 }
    starts_at { 1.day.ago }
    ends_at { 29.days.from_now }
    status { 'active' }
    payment_provider { 'test' }
  end
end
