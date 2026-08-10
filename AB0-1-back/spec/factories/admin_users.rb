# frozen_string_literal: true

FactoryBot.define do
  factory :admin_user do
    sequence(:email) { |n| "admin-#{n}@example.com" }
    password { 'Password123!' }
    password_confirmation { password }
    name { 'Admin de teste' }
  end
end
