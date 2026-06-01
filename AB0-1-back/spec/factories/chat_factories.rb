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
end
