# frozen_string_literal: true

Webpush.config do |config|
  config.public_key = ENV.fetch('VAPID_PUBLIC_KEY', '')
  config.private_key = ENV.fetch('VAPID_PRIVATE_KEY', '')
  config.subject = ENV.fetch('VAPID_SUBJECT', 'mailto:suporte@avaliasolar.com.br')
end
