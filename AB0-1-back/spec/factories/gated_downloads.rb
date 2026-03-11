FactoryBot.define do
  factory :gated_download do
    association :company
    user { nil }
    sequence(:anonymous_id) { |n| "anon-download-#{n}" }
    document_type { 'pdf' }
    document_title { 'Guia Técnico Solar' }
    document_url { 'https://cdn.example.com/guia-tecnico.pdf' }
    contact_name { 'Lead Teste' }
    sequence(:contact_email) { |n| "lead#{n}@empresa.com" }
    contact_phone { '11999998888' }
    metadata { {} }
  end
end
