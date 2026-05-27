require 'base64'

FactoryBot.define do
  factory :plan do
    sequence(:name) { |n| "Basic Plan #{n}" }
    price { 99.90 }
    features { { max_products: 50, dashboard_access: true } }
  end

  factory :company do
    name { Faker::Company.name }
    description { Faker::Company.catch_phrase }
    email { Faker::Internet.email }
    status { :pending }
    active_admin { true }
    association :plan

    # Campos obrigatórios para ativação (validation)
    state { 'SP' }
    city { 'São Paulo' }
    phone { '11999999999' }

    # Initialize JSON columns
    profile_views_count { 0 }
    cta_clicks_count { 0 }
    whatsapp_clicks_count { 0 }
    rating_avg { 0.0 }

    after(:build) do |company|
      if company.status == 'active' && company.categories.empty?
        company.categories << create(:category)
      end
    end
  end

  factory :category do
    sequence(:name) { |n| "Categoria #{n}" }
    description { Faker::Lorem.sentence }
    status { 'active' }
  end

  factory :user do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    password { 'Password123' } # Meets complexity: Upper, lower, number, 8+
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

  factory :company_sector_question do
    association :company
    sequence(:prompt) { |n| "Pergunta setorial #{n}" }
    weight { 1 }
    sequence(:order) { |n| n }
    enabled { true }
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

  factory :review do
    association :company
    association :user
    rating { 4.5 }
    comment { 'Excelente atendimento e suporte durante toda a instalacao.' }
    status { :pending }
    featured { false }
    verified { false }
    display_order { 0 }
  end

  factory :rating_criterion do
    association :category
    sequence(:title) { |n| "Critério #{n}" }
    sequence(:slug) { |n| "criterio_#{n}" }
    weight { 1.0 }
    position { 0 }
    active { true }
  end

  factory :review_criterion_score do
    association :review
    association :rating_criterion
    score { 5.0 }
  end

  factory :product do
    sequence(:name) { |n| "Produto Solar #{n}" }
    sequence(:sku) { |n| "SKU-#{n}" }
    price { 1000.0 }
    status { 'active' }
    association :company
  end

  factory :company_daily_stat do
    association :company
    day { Date.yesterday }
    profile_views { 0 }
    cta_clicks { 0 }
    leads { 0 }
  end
end
