# frozen_string_literal: true

require 'stripe'

Stripe.api_key = ENV['STRIPE_SECRET_KEY']

if Rails.env.production?
  key = ENV['STRIPE_SECRET_KEY']
  if key.blank?
    Rails.logger.warn "[Stripe] STRIPE_SECRET_KEY is missing. Billing features will fail."
  else
    unless key.start_with?('sk_live_') || key.start_with?('sk_test_')
      Rails.logger.warn "[Stripe] STRIPE_SECRET_KEY should start with 'sk_live_' or 'sk_test_'"
    end
  end

  if ENV['STRIPE_BILLING_WEBHOOK_SECRET'].blank?
    Rails.logger.warn "[Stripe] STRIPE_BILLING_WEBHOOK_SECRET is missing. Webhooks will fail."
  end
end
