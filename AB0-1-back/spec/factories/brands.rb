# frozen_string_literal: true

FactoryBot.define do
  factory :brand do
    sequence(:name) { |n| "Marca Solar #{n}" }
    sequence(:slug) { |n| "marca-solar-#{n}" }
    aliases { [] }
    status { 'active' }

    trait :with_aliases do
      aliases { ['MS', 'Marca Solar Alternativa'] }
    end

    trait :disabled do
      status { 'disabled' }
    end

    trait :with_logo do
      after(:build) do |brand|
        brand.logo.attach(
          io: StringIO.new("\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"),
          filename: 'test_logo.png',
          content_type: 'image/png'
        )
      end
    end
  end
end
