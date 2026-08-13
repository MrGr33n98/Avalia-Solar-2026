FactoryBot.define do
  factory :reviewer_profile do
    association :user
    profession { 'Engenheiro' }
    bio { 'Experiência em energia solar.' }
  end
end
