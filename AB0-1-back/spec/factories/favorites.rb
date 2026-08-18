FactoryBot.define do
  factory :favorite do
    association :user
    association :favoritable, factory: :company
  end
end
