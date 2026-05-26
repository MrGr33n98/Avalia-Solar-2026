module Billing
  class SubscriptionSerializer < ActiveModel::Serializer
    attributes :id, :status, :stripe_customer_id, :stripe_subscription_id,
               :current_period_start, :current_period_end, :cancel_at_period_end,
               :is_enterprise_manual, :enterprise_notes, :last_synced_at

    belongs_to :plan, serializer: ::Billing::PlanSerializer
    belongs_to :company

    # Apenas expõe IDs e info básica do Stripe sem chaves privadas
  end
end
