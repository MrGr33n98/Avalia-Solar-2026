# frozen_string_literal: true

require 'stripe'

Stripe.api_key = ENV['STRIPE_SECRET_KEY']

if Rails.env.production?
  raise "STRIPE_SECRET_KEY deve ser live em produção" unless ENV['STRIPE_SECRET_KEY']&.start_with?('sk_live_')
  raise "STRIPE_BILLING_WEBHOOK_SECRET é obrigatório em produção" if ENV['STRIPE_BILLING_WEBHOOK_SECRET'].blank?
end
