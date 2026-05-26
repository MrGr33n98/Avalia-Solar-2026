FactoryBot.define do
  factory :intent_score do
    association :company
    lead_user { nil }
    lead_record { nil }
    sequence(:anonymous_id) { |n| "anon-score-#{n}" }
    session_id { 'session-1' }
    total_score { 25 }
    intent_level { 'cold' }
    micro_interaction_score { 10 }
    research_intent_score { 0 }
    financial_intent_score { 0 }
    contact_intent_score { 0 }
    total_signals_count { 1 }
    hot_signals_count { 0 }
    unique_sessions_count { 1 }
    unique_pages_count { 1 }
    first_interaction_at { 2.hours.ago }
    last_interaction_at { 1.hour.ago }
    last_hot_signal_at { nil }
    days_active { 1 }
    decay_factor { 1.0 }
    confidence_score { 0.25 }
    scoring_version { 'v1' }
    score_breakdown { {} }
    top_signals { [] }

    trait :for_lead do
      association :lead_user, factory: :user
      anonymous_id { nil }
    end
  end
end
