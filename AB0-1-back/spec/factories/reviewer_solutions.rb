FactoryBot.define do
  factory :reviewer_solution do
    association :user
    sequence(:name) { |n| "Solução #{n}" }
    solution_type { 'technology' }
    category { 'Energia Solar' }
    verified { false }
  end
end
