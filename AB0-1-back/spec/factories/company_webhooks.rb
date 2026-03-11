FactoryBot.define do
  factory :company_webhook do
    association :company
    sequence(:url) { |n| "https://hooks#{n}.example.com/intent" }
    secret_key { SecureRandom.hex(32) }
    active { true }
    events { ['intent.hot'] }
  end
end
