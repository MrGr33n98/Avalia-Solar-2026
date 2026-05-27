# frozen_string_literal: true

require 'stripe'

Stripe.api_key = ENV['STRIPE_SECRET_KEY']

if Rails.env.production?
  key = ENV['STRIPE_SECRET_KEY']
  raise "STRIPE_SECRET_KEY is missing" if key.blank?
  unless key.start_with?('sk_live_') || key.start_with?('sk_test_')
    raise "STRIPE_SECRET_KEY must start with 'sk_live_' or 'sk_test_' in production"
  end
  raise "STRIPE_BILLING_WEBHOOK_SECRET is required in production" if ENV['STRIPE_BILLING_WEBHOOK_SECRET'].blank?
end
