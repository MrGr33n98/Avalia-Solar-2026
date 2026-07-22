# frozen_string_literal: true

FactoryBot.define do
  factory :chat_session do
    visitor_id { SecureRandom.uuid }
    status { 'active' }
    vertical { 'solar' }
    page_url { 'https://www.avaliasolar.com.br/' }
    message_count { 0 }
  end

  factory :chat_message do
    association :chat_session
    role { 'user' }
    content { 'Olá' }
    safety_status { 'clean' }
  end

  factory :chat_lead do
    association :chat_session
    name { 'Cliente de teste' }
    phone { '65999998888' }
    city { 'Cuiabá' }
    state { 'MT' }
    vertical { 'solar' }
    intent { 'solar_quote' }
    sales_status { 'qualified' }
    consent_given { true }
    consent_given_at { Time.current }
  end

  factory :knowledge_article do
    association :category
    title { 'Artigo de Suporte de Teste' }
    content { 'Conteúdo explicativo e detalhado do teste de suporte.' }
    status { 'published' }
    published_at { Time.current }
  end
end
