module Billing
  class CheckoutService
    def initialize(company:, plan:, current_user:)
      @company = company
      @plan    = plan
      @user    = current_user
    end

    def call
      validate_plan_configuration!
      
      subscription = find_or_initialize_subscription
      stripe_customer_id = ensure_stripe_customer!(subscription)
      
      create_checkout_session(stripe_customer_id)
    rescue Stripe::StripeError => e
      Rails.logger.error("[Billing::CheckoutService] Stripe Error: #{e.message} for company_id=#{@company.id}")
      raise Billing::Errors::StripeSessionCreationFailed, "Falha na comunicação com o Stripe: #{e.message}"
    end

    private

    def validate_plan_configuration!
      if @plan.stripe_price_id_monthly.blank?
        Rails.logger.error("[Billing::CheckoutService] Plan plan_id=#{@plan.id} has no stripe_price_id_monthly configured.")
        raise Billing::Errors::PlanNotConfigured, 'Este plano não está configurado para cobrança digital.'
      end
    end

    def find_or_initialize_subscription
      Billing::CompanySubscription.find_or_initialize_by(company: @company) do |sub|
        sub.plan = @plan
        sub.status = 'incomplete'
      end
    end

    def ensure_stripe_customer!(subscription)
      if subscription.stripe_customer_id.present?
        subscription.stripe_customer_id
      else
        customer = Stripe::Customer.create(
          email: @company.email,
          name: @company.name,
          metadata: { company_id: @company.id }
        )
        subscription.update!(stripe_customer_id: customer.id)
        customer.id
      end
    end

    def create_checkout_session(stripe_customer_id)
      cache_key = "checkout_session:#{@company.id}:#{@plan.id}"
      
      cached_url = Rails.cache.read(cache_key)
      return cached_url if cached_url.present?

      frontend_url = ENV.fetch('FRONTEND_URL') { 'http://localhost:3000' }
      
      session = Stripe::Checkout::Session.create(
        customer: stripe_customer_id,
        mode: 'subscription',
        line_items: [{ price: @plan.stripe_price_id_monthly, quantity: 1 }],
        subscription_data: { 
          metadata: { 
            company_id: @company.id.to_s,
            plan_id: @plan.id.to_s
          } 
        },
        success_url: "#{frontend_url}/company-dashboard/billing?session_id={CHECKOUT_SESSION_ID}&status=success",
        cancel_url: "#{frontend_url}/company-dashboard/billing?status=cancelled",
        client_reference_id: @company.id.to_s,
        metadata: { 
          company_id: @company.id.to_s, 
          plan_id: @plan.id.to_s, 
          initiated_by: @user.id.to_s 
        }
      )
      
      Rails.cache.write(cache_key, session.url, expires_in: 30.minutes)

      session.url
    end
  end
end
