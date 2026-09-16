FactoryBot.define do
  factory :analytics_event do
    transient do
      company { association(:company) }
      user { nil }
    end

    company_id { company.id }
    user_id { user&.id }
    event_type { 'profile_view' }
    tracked_at { Time.current }
    metadata { {} }
  end
end
