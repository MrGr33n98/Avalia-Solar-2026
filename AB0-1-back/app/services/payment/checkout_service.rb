module Payment
  class CheckoutService
    def initialize(subscription)
      @subscription = subscription
      @offer = if subscription.respond_to?(:checkout_product)
                 subscription.checkout_product
               else
                 subscription.banner_offer
               end
      @company = subscription.company
    end

    def create_checkout_session(provider)
      case provider.to_s.downcase
      when 'stripe'
        create_stripe_session
      when 'mercadopago'
        create_mercadopago_preference
      else
        raise ArgumentError, "Unsupported payment provider: #{provider}"
      end
    end

    private

    def create_stripe_session
      # Return a mock URL if keys are not set, but the structure is real
      return "https://checkout.stripe.com/pay/mock_#{SecureRandom.hex(16)}" if ENV['STRIPE_SECRET_KEY'].blank?

      Stripe.api_key = ENV['STRIPE_SECRET_KEY']
      
      session = Stripe::Checkout::Session.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'brl',
            product_data: {
              name: "Banner: #{@offer.name}",
              description: @offer.description,
            },
            unit_amount: checkout_price_cents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: "#{ENV['FRONTEND_URL']}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&status=success",
        cancel_url: "#{ENV['FRONTEND_URL']}/dashboard/billing?status=cancelled",
        client_reference_id: @subscription.checkout_session_id,
        metadata: {
          subscription_id: @subscription.id,
          company_id: @company.id
        }
      })

      session.url
    end

    def create_mercadopago_preference
      # MercadoPago SDK usage
      return "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_#{SecureRandom.hex(12)}" if ENV['MERCADOPAGO_ACCESS_TOKEN'].blank?

      sdk = Mercadopago::SDK.new(ENV['MERCADOPAGO_ACCESS_TOKEN'])
      
      preference_data = {
        items: [
          {
            title: "Banner: #{@offer.name}",
            unit_price: checkout_price_cents / 100.0,
            quantity: 1,
            currency_id: 'BRL'
          }
        ],
        external_reference: @subscription.checkout_session_id,
        back_urls: {
          success: "#{ENV['FRONTEND_URL']}/dashboard/billing?status=success",
          failure: "#{ENV['FRONTEND_URL']}/dashboard/billing?status=failure",
          pending: "#{ENV['FRONTEND_URL']}/dashboard/billing?status=pending"
        },
        auto_return: 'approved',
        notification_url: "#{ENV['BACKEND_URL']}/api/v1/payments_webhooks/mercadopago"
      }

      preference_response = sdk.preference.create(preference_data)
      preference = preference_response[:response]
      
      # link for redirect
      preference['init_point']
    end

    def checkout_price_cents
      return @subscription.price_paid_cents if @subscription.respond_to?(:price_paid_cents)

      @offer.price_cents
    end
  end
end
