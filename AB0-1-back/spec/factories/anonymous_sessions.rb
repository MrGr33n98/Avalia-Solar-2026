FactoryBot.define do
  factory :anonymous_session do
    sequence(:anonymous_id) { |n| "anon-session-#{n}" }
    user { nil }
    company { nil }
    ip_hash { 'hashed-ip' }
    user_agent_hash { 'hashed-ua' }
    device_type { 'desktop' }
    visited_company_ids { [] }
    visited_pages { [] }
    pageviews_count { 0 }
    session_duration_sec { 0 }
    first_seen_at { 2.days.ago }
    last_seen_at { 1.hour.ago }
    status { 'anonymous' }
    stitch_metadata { {} }
  end
end
