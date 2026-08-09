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
end
