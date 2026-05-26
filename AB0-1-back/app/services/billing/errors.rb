module Billing
  module Errors
    class BillingError < StandardError; end
    class PlanNotConfigured < BillingError; end
    class CompanySubscriptionMissing < BillingError; end
    class StripeSessionCreationFailed < BillingError; end
    class InvalidPaymentStatus < BillingError; end
    class UnauthorizedAction < BillingError; end
    class InvalidWebhookSignature < BillingError; end
  end
end
