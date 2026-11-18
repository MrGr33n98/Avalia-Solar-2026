# frozen_string_literal: true

FactoryBot.define do
  factory :reviewer_brand_usage do
    association :user
    association :brand
    usage_context { 'integrator_install' }
    source { 'manual' }
    experience_since { 1.year.ago.to_date }
    description { 'Uso contínuo em instalações comerciais e residenciais' }
    visibility { 'private' }
    verification_status { 'self_declared' }
    status { 'active' }

    trait :public do
      visibility { 'public' }
      consent_version { 'v1.0' }
      opted_in_at { Time.current }
    end

    trait :verified do
      verification_status { 'evidence_verified' }
    end

    trait :disabled do
      status { 'disabled' }
    end
  end

  factory :reviewer_brand_usage_event do
    association :reviewer_brand_usage
    association :actor, factory: :user
    action { 'created' }
    new_status { 'active' }
  end
end
