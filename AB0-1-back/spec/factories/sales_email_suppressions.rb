FactoryBot.define do
  factory :sales_email_suppression, class: 'Sales::EmailSuppression' do
    association :company
    sequence(:email) { |n| "suppressed-#{n}@example.com" }
    reason { 'manual' }
    suppressed_at { Time.current }
  end
end
