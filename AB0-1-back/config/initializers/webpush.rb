# frozen_string_literal: true

# The ruby webpush gem does not have a Webpush.config method.
# Store these in Rails configuration instead for later use when calling Webpush.payload_send:
Rails.application.config.x.webpush.public_key = ENV.fetch('VAPID_PUBLIC_KEY', '')
Rails.application.config.x.webpush.private_key = ENV.fetch('VAPID_PRIVATE_KEY', '')
Rails.application.config.x.webpush.subject = ENV.fetch('VAPID_SUBJECT', 'mailto:suporte@avaliasolar.com.br')
