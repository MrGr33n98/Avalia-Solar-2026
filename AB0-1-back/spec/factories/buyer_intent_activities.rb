FactoryBot.define do
  factory :buyer_intent_activity do
    association :company
    user { nil }
    sequence(:anonymous_id) { |n| "anon-#{n}" }
    sequence(:session_id) { |n| "session-#{n}" }
    signal_type { 'hover_intent' }
    signal_category { 'micro_interaction' }
    intent_weight { BuyerIntentActivity::INTENT_WEIGHTS.fetch(signal_type, 1) }
    element_selector { '.intent-target' }
    element_type { 'button' }
    page_path { '/companies/example' }
    referrer_host { 'google.com' }
    duration_ms { 1_200 }
    metadata { {} }
    ip_hash { 'hashed-ip' }
    user_agent { 'Mozilla/5.0' }
    device_type { 'desktop' }
    tracked_at { Time.current }
  end
end
