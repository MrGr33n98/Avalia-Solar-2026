FactoryBot.define do
  factory :lead_distribution do
    association :lead
    association :company
    status { :queued }
    assigned_at { Time.current }
  end
end
