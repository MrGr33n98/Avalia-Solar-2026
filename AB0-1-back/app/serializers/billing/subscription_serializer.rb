module Billing
  class SubscriptionSerializer < ActiveModel::Serializer
    # Dados comerciais basicos: visiveis para membros ativos da empresa.
    # Contrato minimo necessario ao dashboard. Nao serializar o perfil
    # publico completo da empresa a cada consulta de faturamento.
    attributes :id, :company_id, :plan_id, :status,
               :trial_start, :trial_end, :current_period_start, :current_period_end,
               :cancel_at_period_end, :is_enterprise_manual, :last_synced_at,
               :created_at, :updated_at, :can_manage_billing

    # Identificadores de pagamento e anotacoes privadas: somente owner/admin.
    attribute :stripe_customer_id, if: :can_manage_billing?
    attribute :stripe_subscription_id, if: :can_manage_billing?
    attribute :enterprise_notes, if: :can_manage_billing?

    belongs_to :plan, serializer: ::Billing::PlanSerializer

    def can_manage_billing
      can_manage_billing?
    end

    # ActiveModelSerializers utiliza public_send para avaliar `if:`.
    # Precisa ser publico para impedir 500 no GET /billing/subscription.
    def can_manage_billing?
      return false unless scope

      ::BillingPolicy.new(scope, object.company).portal?
    end
  end
end
