FactoryBot.define do
  factory :analytics_event do
    association :company
    event_type { 'profile_view' }
    tracked_at { Time.current }
    metadata { {} }
  end
end
