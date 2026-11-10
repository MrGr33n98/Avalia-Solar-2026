# frozen_string_literal: true

# Reusable model-backed factories for request/model contracts. Keep these
# minimal: no globally enabled paid features, hidden records, or external calls.
FactoryBot.define do
  factory :company_product do
    association :company
    association :product
    relationship_type { 'catalog_owner' }
    status { 'active' }
  end

  factory :company_profile_view do
    association :company
    session_fingerprint { SecureRandom.hex(32) }
    ip_hash { Digest::SHA256.hexdigest(SecureRandom.hex(12)) }
    user_agent_hash { Digest::SHA256.hexdigest('rspec-agent') }
    viewed_at { Time.current }
  end

  factory :badge do
    sequence(:name) { |n| "Test badge #{n}" }
    active { true }
  end

  factory :company_faq do
    association :company
    sequence(:question) { |n| "Pergunta de teste #{n}?" }
    answer { 'Resposta de teste.' }
    sequence(:position) { |n| n }
    status { 'published' }
  end

  factory :campaign do
    association :company
    sequence(:name) { |n| "Campanha de teste #{n}" }
    priority { 0 }
    budget { 100.0 }
    start_date { 1.day.ago }
    end_date { 1.day.from_now }
  end

  factory :reaction do
    association :user
    association :reactable, factory: :review
    reaction_type { 'useful' }
  end

  factory :company_trust_score do
    association :company
    score { 75.0 }
  end

  factory :company_utm_attribution do
    association :company
    sequence(:utm_source) { |n| "rspec_source_#{n}" }
    utm_medium { 'cpc' }
    sequence(:utm_campaign) { |n| "rspec_campaign_#{n}" }
    total_visits { 1 }
    total_leads { 0 }
    conversion_rate { 0.0 }
  end
end
