# frozen_string_literal: true

FactoryBot.define do
  factory :achievement_badge do
    sequence(:slug) { |n| "achievement_badge_#{n}" }
    sequence(:name) { |n| "Conquista #{n}" }
    description { 'Descrição detalhada da conquista de teste.' }
    category { 'review' }
    tier { 'bronze' }
    points_xp { 50 }
    metric_key { 'approved_reviews_count' }
    threshold { 1 }
    action_enum { 'write_review' }
    earned_asset_path { 'cards/01_review_approved_1.svg' }
    locked_asset_path { 'cards_locked/01_review_approved_1_locked.svg' }
    sequence(:position) { |n| n }
    active { true }
    revocable { true }
  end

  factory :user_achievement do
    user
    achievement_badge
    state { 'unlocked' }
    unlocked_at { Time.current }
    sequence(:share_token) { |n| "token_#{n}_#{SecureRandom.hex(8)}" }
  end

  factory :achievement_ledger do
    user
    achievement_badge
    kind { 'unlocked' }
    xp_delta { 50 }
    sequence(:idempotency_key) { |n| "idempotency_key_#{n}_#{SecureRandom.hex(8)}" }
    reason { 'Motivo de auditoria' }
  end
end
