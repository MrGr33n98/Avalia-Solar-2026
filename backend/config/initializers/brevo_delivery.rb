# frozen_string_literal: true

if ENV["BREVO_API_KEY"].present?
  ActionMailer::Base.add_delivery_method :brevo, BrevoDelivery
  ActionMailer::Base.delivery_method = :brevo
  Rails.logger.info "✅ ActionMailer set to Brevo HTTP API"
end
