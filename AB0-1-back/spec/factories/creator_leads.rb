FactoryBot.define do
  factory :creator_lead do
    association :creator_user, factory: :user
    name { 'Visitante Solar' }
    email { 'visitante@example.com' }
    intent { 'contact_creator' }
    consent_at { Time.current }
  end
end
