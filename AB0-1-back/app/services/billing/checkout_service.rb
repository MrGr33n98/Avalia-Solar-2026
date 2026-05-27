require 'digest'
require 'uri'

module Billing
  class CheckoutService
    def initialize(company:, plan:, current_user:, success_url: nil, cancel_url: nil)
      @company = company
      @plan    = plan
      @user    = current_user
      @success_url = success_url
      @cancel_url = cancel_url
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
      success_url = checkout_success_url
      cancel_url = checkout_cancel_url
      cache_key = "checkout_session:#{@company.id}:#{@plan.id}:#{Digest::SHA256.hexdigest("#{success_url}|#{cancel_url}")}"
      
      cached_url = Rails.cache.read(cache_key)
      return cached_url if cached_url.present?
      
      items = [{ price: @plan.stripe_price_id_monthly, quantity: 1 }]
      
      # Adiciona a Taxa de Setup dinamicamente no Checkout (Pagamento único)
      if @plan.respond_to?(:setup_fee) && @plan.setup_fee.to_i > 0 && !@plan.setup_included
        items << {
          price_data: {
            currency: 'brl',
            unit_amount: (@plan.setup_fee.to_f * 100).to_i, # Stripe cobra em centavos
            product_data: {
              name: "Taxa de Setup - #{@plan.name}",
              description: "Implementação completa e onboarding assistido"
            }
          },
          quantity: 1
        }
      end

      session = Stripe::Checkout::Session.create(
        customer: stripe_customer_id,
        mode: 'subscription',
        line_items: items,
        subscription_data: { 
          metadata: { 
            company_id: @company.id.to_s,
            plan_id: @plan.id.to_s
          } 
        },
        success_url: success_url,
        cancel_url: cancel_url,
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

    def checkout_success_url
      sanitized_checkout_url(
        @success_url,
        "#{frontend_url}/company-dashboard/billing?session_id={CHECKOUT_SESSION_ID}&status=success"
      )
    end

    def checkout_cancel_url
      sanitized_checkout_url(
        @cancel_url,
        "#{frontend_url}/company-dashboard/billing?status=cancelled"
      )
    end

    def sanitized_checkout_url(value, fallback)
      uri = URI.parse(value.to_s)
      return fallback unless uri.is_a?(URI::HTTP) && uri.host.present?

      allowed_hosts = [URI.parse(frontend_url).host, 'localhost', '127.0.0.1'].compact.uniq
      return value if allowed_hosts.include?(uri.host)

      Rails.logger.warn(
        "[Billing::CheckoutService] Rejected checkout redirect host=#{uri.host} company_id=#{@company.id}"
      )
      fallback
    rescue URI::InvalidURIError
      fallback
    end

    def frontend_url
      @frontend_url ||= ENV.fetch('FRONTEND_URL') { 'http://localhost:3000' }.delete_suffix('/')
    end
  end
end
