module Api
  module V1
    module Billing
      class PlansController < Api::V1::BaseController
        # Não exige autenticação de usuário para ver planos públicos
        # (mas o BaseController também não obriga unless especificado)

        def index
          plans = Plan.where(is_public: true).order(:display_order)
          render json: plans, each_serializer: ::Billing::PlanSerializer
        rescue StandardError => e
          Rails.logger.error("Billing Plans API error: #{e.message}")
          render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
        end
      end
    end
  end
end
