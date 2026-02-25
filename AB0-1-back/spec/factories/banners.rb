# frozen_string_literal: true

# FactoryBot Factories - Fase 1
# Define factories para testes de banners

FactoryBot.define do
  factory :banner do
    title { Faker::Lorem.sentence(word_count: 3) }
    link { Faker::Internet.url }
    position { Banner::ALLOWED_POSITIONS.sample }
    banner_type { Banner::ALLOWED_BANNER_TYPES.sample }
    moderation_status { 'draft' }
    active { false }
    width { 960 }
    height { 100 }
    priority { 100 }

    # Anexa imagem de teste
    after(:build) do |banner|
      banner.image.attach(
        io: File.open(Rails.root.join('spec', 'fixtures', 'files', 'banner_test.png')),
        filename: 'banner_test.png',
        content_type: 'image/png'
      )
    end

    trait :draft do
      moderation_status { 'draft' }
      active { false }
    end

    trait :submitted do
      moderation_status { 'submitted' }
      active { false }
    end

    trait :approved do
      moderation_status { 'approved' }
      approved_at { Time.current }
      association :approved_by_admin_user, factory: :admin_user
    end

    trait :rejected do
      moderation_status { 'rejected' }
      rejected_reason { 'Conteúdo inadequado' }
      active { false }
      approved_at { Time.current }
      association :approved_by_admin_user, factory: :admin_user
    end

    trait :with_image do
      after(:create) do |banner|
        banner.image.attach(
          io: File.open(Rails.root.join('spec', 'fixtures', 'files', 'banner_test.png')),
          filename: 'banner_test.png',
          content_type: 'image/png'
        )
      end
    end

    trait :with_categories do
      after(:create) do |banner|
        banner.categories << create_list(:category, 2)
      end
    end

    trait :sponsored do
      sponsored { true }
    end

    trait :navbar do
      position { 'navbar' }
      width { 960 }
      height { 100 }
    end

    trait :sidebar do
      position { 'sidebar' }
      width { 150 }
      height { 125 }
    end

    trait :expired do
      start_date { 3.days.ago }
      end_date { 1.day.ago }
    end

    trait :future do
      start_date { 1.day.from_now }
      end_date { 3.days.from_now }
    end
  end

  factory :banner_global do
    title { Faker::Lorem.sentence }
    link { Faker::Internet.url }

    after(:build) do |banner_global|
      banner_global.image.attach(
        io: File.open(Rails.root.join('spec', 'fixtures', 'files', 'banner_test.png')),
        filename: 'banner_global_test.png',
        content_type: 'image/png'
      )
    end
  end

  factory :banner_offer do
    name { Faker::Commerce.product_name }
    price_cents { rand(1000..50_000) }
    currency { 'BRL' }
    duration_days { 30 }
    active { true }
    rules_json do
      {
        positions: %w[navbar sidebar],
        banner_types: %w[rectangular_large rectangular_small],
        requires_moderation: true,
        max_active_per_position: 5
      }
    end

    trait :with_limits do
      rules_json do
        {
          positions: %w[navbar sidebar categories_top],
          banner_types: %w[rectangular_large rectangular_small],
          requires_moderation: true,
          max_active_per_position: 2,
          max_total_active: 3
        }
      end
    end

    trait :premium do
      name { 'Plano Premium' }
      price_cents { 29_900 }
      rules_json do
        {
          positions: Banner::ALLOWED_POSITIONS,
          banner_types: Banner::ALLOWED_BANNER_TYPES,
          requires_moderation: false,
          max_active_per_position: 10,
          max_total_active: 20
        }
      end
    end
  end

  factory :banner_subscription do
    association :company
    association :banner_offer
    status { 'pending_payment' }

    trait :active do
      status { 'active' }
      starts_at { Time.current }
      ends_at { 30.days.from_now }
      activated_at { Time.current }
    end

    trait :expired do
      status { 'expired' }
      starts_at { 60.days.ago }
      ends_at { 1.day.ago }
      activated_at { 60.days.ago }
    end

    trait :canceled do
      status { 'canceled' }
      canceled_at { Time.current }
      failure_reason { 'Cancelado pelo usuário' }
    end
  end

  factory :banner_event do
    association :banner
    event_type { %w[view click].sample }
    tracked_at { Time.current }
    ip_hash { Digest::SHA256.hexdigest(Faker::Internet.ip_v4_address) }
    user_agent_hash { Digest::SHA256.hexdigest(Faker::Internet.user_agent) }

    trait :view do
      event_type { 'view' }
    end

    trait :click do
      event_type { 'click' }
    end
  end

  factory :banner_daily_stat do
    association :banner
    day { Date.current }
    views_count { rand(100..1000) }
    clicks_count { rand(10..100) }
    ctr { (clicks_count.to_f / views_count * 100).round(2) }
  end
end
