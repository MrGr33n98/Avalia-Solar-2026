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

  factory :group_topic do
    association :group
    name { 'Migração ACL' }
    slug { 'migracao-acl' }
    description { 'Discussões sobre migração.' }
    position { 0 }
    active { true }
  end

  factory :group_rule do
    association :group
    title { 'Respeito entre membros' }
    description { 'Mantenha discussões profissionais.' }
    position { 0 }
    active { true }
  end
end