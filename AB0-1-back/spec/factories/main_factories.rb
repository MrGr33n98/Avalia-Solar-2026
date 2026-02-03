require 'base64'

FactoryBot.define do
  factory :plan do
    name { "Basic Plan" }
    price { 99.90 }
    features { { max_products: 50, dashboard_access: true } }
  end

  factory :company do
    name { Faker::Company.name }
    description { Faker::Company.catch_phrase }
    email { Faker::Internet.email }
    status { :pending }
    association :plan
    
    # Initialize JSON columns
    profile_views_count { 0 }
    cta_clicks_count { 0 }
    whatsapp_clicks_count { 0 }
    rating_avg { 0.0 }
  end

  factory :category do
    sequence(:name) { |n| "Categoria #{n}" }
    description { Faker::Lorem.sentence }
    status { 'active' }
  end

  factory :user do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    password { "Password123" } # Meets complexity: Upper, lower, number, 8+
    association :company
    status { :active }
    role { :company }
    terms_accepted { true }
    terms_accepted_at { Time.current }
  end

  factory :company_member do
    association :company
    association :user
    role { :editor }
  end

  factory :company_access_request do
    association :user
    association :company
    status { 'pending' }
    requested_at { Time.current }
  end
  
  factory :lead do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    phone { Faker::PhoneNumber.cell_phone }
    association :company
  end
end
