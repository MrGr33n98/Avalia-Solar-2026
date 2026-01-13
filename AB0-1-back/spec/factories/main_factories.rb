require 'base64'

FactoryBot.define do
  BANNER_1X1_PNG = Base64.decode64(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6X7h2cAAAAASUVORK5CYII='
  )

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

  factory :banner do
    title { "Banner #{SecureRandom.hex(4)}" }
    link { 'https://example.com' }
    banner_type { 'rectangular_large' }
    position { 'categories_top' }
    active { true }
    sponsored { false }
    moderation_status { 'approved' }
    width { 600 }
    height { 200 }

    transient do
      categories_count { 0 }
    end

    after(:build) do |banner|
      next if banner.image.attached?

      banner.image.attach(
        io: StringIO.new(BANNER_1X1_PNG),
        filename: 'banner.png',
        content_type: 'image/png'
      )
    end

    after(:create) do |banner, evaluator|
      next if evaluator.categories_count.to_i <= 0

      banner.categories = create_list(:category, evaluator.categories_count)
      banner.save!
    end
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
