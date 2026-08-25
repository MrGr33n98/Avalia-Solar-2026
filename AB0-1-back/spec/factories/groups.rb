FactoryBot.define do
  factory :group do
    association :owner, factory: :user
    name { 'Mercado Livre de Energia' }
    sequence(:slug) { |n| "mercado-livre-de-energia-#{n}" }
    description { 'Discussões profissionais sobre energia.' }
    short_description { 'Comunidade profissional de energia.' }
    visibility { 'public' }
    membership_mode { 'open' }
    posting_mode { 'members' }
    status { 'active' }
  end

  factory :group_membership do
    association :group
    association :user
    role { 'member' }
    status { 'active' }
    joined_at { Time.current }
    approved_at { Time.current }
    notifications_level { 'highlights' }
  end
end