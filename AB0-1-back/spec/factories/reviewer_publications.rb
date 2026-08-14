FactoryBot.define do
  factory :reviewer_publication do
    association :user
    sequence(:title) { |n| "Publicação #{n}" }
    sequence(:slug) { |n| "publicacao-#{n}" }
    body { 'Conteúdo público da publicação.' }
    status { 'draft' }
    publication_type { 'article' }
  end
end
