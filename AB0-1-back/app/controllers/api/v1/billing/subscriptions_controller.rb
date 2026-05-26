module Api
  module V1
    module Billing
      class SubscriptionsController < Api::V1::BaseController
        before_action :authenticate_api_user

        def show
          company = ::Company.find(params[:company_id])

          # Autorização Pundit usando a classe de política explícita
          authorize company, :show?, policy_class: BillingPolicy

          subscription = ::Billing::CompanySubscription.find_by(company: company)

          if subscription
            render json: subscription, serializer: ::Billing::SubscriptionSerializer, status: :ok
          else
            render json: { error: 'Nenhuma assinatura configurada para esta empresa' }, status: :not_found
          end
        rescue ActiveRecord::RecordNotFound => e
          render json: { error: 'Empresa não encontrada' }, status: :not_found
        rescue Pundit::NotAuthorizedError => e
          render json: { error: 'Você não tem permissão para realizar esta ação' }, status: :forbidden
        rescue StandardError => e
          Rails.logger.error("Subscription show error: #{e.message}")
          render json: { error: 'Erro interno ao consultar assinatura' }, status: :internal_server_error
        end
      end
    end
  end
end
