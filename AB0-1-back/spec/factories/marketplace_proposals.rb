FactoryBot.define do
  factory :marketplace_proposal do
    association :lead
    association :company
    lead_distribution { association(:lead_distribution, lead: lead, company: company) }
    association :buyer_user, factory: :user
    association :created_by, factory: :user
    sequence(:reference) { |n| "AS-TEST-#{n}" }
    status { 'sent' }
    currency { 'BRL' }
    total_cents { 0 }
    current_version_number { 0 }
  end
end
