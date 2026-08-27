FactoryBot.define do
  factory :creator_tree_setting do
    reviewer_profile
    theme_key { 'solar' }
    appearance { {} }
  end
end
