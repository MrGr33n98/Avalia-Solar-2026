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
            render json: subscription, serializer: ::Billing::SubscriptionSerializer,
                   scope: current_user, status: :ok
          else
            render json: { error: 'Nenhuma assinatura configurada para esta empresa' }, status: :not_found
          end
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Empresa não encontrada' }, status: :not_found
        rescue Pundit::NotAuthorizedError
          render json: { error: 'Você não tem permissão para realizar esta ação' }, status: :forbidden
        rescue StandardError => e
          Rails.logger.error(
            "[BillingSubscription#show] request_id=#{request.request_id} " \
            "company_id=#{params[:company_id]} error_class=#{e.class} " \
            "message=#{e.message} trace=#{e.backtrace&.first(5)&.join(' | ')}"
          )
          render json: {
            error: 'Erro interno ao consultar assinatura',
            code: 'BILLING_SUBSCRIPTION_UNAVAILABLE',
            request_id: request.request_id
          }, status: :internal_server_error
        end
      end
    end
  end
end
