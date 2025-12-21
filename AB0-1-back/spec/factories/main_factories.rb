FactoryBot.define do
  factory :plan do
    name { "Basic Plan" }
    price { 99.90 }
    features_json { { max_products: 50, dashboard_access: true }.to_json }
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
    email { Faker::Internet.email }
    password { "password123" }
    association :company
    status { :active }
    role { :company_admin }
  end
  
  factory :lead do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    phone { Faker::PhoneNumber.cell_phone }
    association :company
  end
end
