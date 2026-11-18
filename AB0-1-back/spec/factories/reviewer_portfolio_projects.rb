# frozen_string_literal: true

FactoryBot.define do
  factory :reviewer_portfolio_project do
    association :user
    title { 'Instalação Solar Residencial 5kWp' }
    project_type { 'residential' }
    city { 'Campinas' }
    state { 'SP' }
    started_at { 3.months.ago.to_date }
    completed_at { 1.month.ago.to_date }
    capacity_kwp { 5.5 }
    visibility { 'private' }
    verification_status { 'self_declared' }
    status { 'active' }
    description { 'Instalação com 10 módulos e 1 inversor string.' }
    lock_version { 0 }
  end
end
