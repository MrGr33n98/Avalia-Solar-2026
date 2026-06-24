FactoryBot.define do
  factory :conversation do
    association :user, role: 'review', company: nil, city: 'São Paulo', state: 'SP'
    association :company
  end

  factory :direct_message do
    association :conversation
    body { 'Olá, gostaria de conversar sobre energia solar.' }
    sender_type { 'User' }
  end

  factory :conversation_event do
    association :conversation
    association :actor, factory: :user
    event_type { 'message.created' }
    metadata { {} }
    created_at { Time.current }
  end

  factory :conversation_report do
    association :conversation
    association :reporter, factory: :user
    reason { 'other' }
    status { 'open' }
    metadata { {} }
  end

  factory :push_token do
    association :user
    token { "ExponentPushToken[#{SecureRandom.hex(8)}]" }
    platform { 'android' }
    active { true }
    last_seen_at { Time.current }
  end
end
