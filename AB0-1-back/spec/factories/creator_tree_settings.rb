FactoryBot.define do
  factory :creator_tree_setting do
    association :reviewer, factory: :reviewer_profile
    theme_key { 'solar' }
    appearance { {} }
  end
end
