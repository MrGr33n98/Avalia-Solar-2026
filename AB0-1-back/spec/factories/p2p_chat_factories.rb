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
end
