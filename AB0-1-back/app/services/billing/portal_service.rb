module Billing
  class PortalService
    def initialize(company:)
      @company = company
    end

    def call
      subscription = Billing::CompanySubscription.find_by(company: @company)
      
      if subscription.nil? || subscription.stripe_customer_id.blank?
        Rails.logger.error("[Billing::PortalService] No Stripe Customer ID found for company_id=#{@company.id}")
        raise Billing::Errors::CompanySubscriptionMissing, 'Não foi encontrada uma conta de faturamento ativa para esta empresa.'
      end

      session = Stripe::BillingPortal::Session.create(
        customer: subscription.stripe_customer_id,
        return_url: "#{ENV.fetch('FRONTEND_URL') { 'http://localhost:3000' }}/company-dashboard/billing"
      )

      session.url
    rescue Stripe::StripeError => e
      Rails.logger.error("[Billing::PortalService] Stripe Portal Session Creation failed: #{e.message} for company_id=#{@company.id}")
      raise Billing::Errors::StripeSessionCreationFailed, "Falha ao gerar portal de faturamento: #{e.message}"
    end
  end
end
