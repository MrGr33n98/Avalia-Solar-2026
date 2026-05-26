module Api
  module V1
    module Billing
      class CheckoutController < Api::V1::BaseController
        before_action :authenticate_api_user

        def create
          company = ::Company.find(params[:company_id])
          plan = ::Plan.find(params[:plan_id])

          # Autorização Pundit usando a classe de política explícita
          authorize company, :checkout?, policy_class: BillingPolicy

          checkout_url = ::Billing::CheckoutService.new(
            company: company,
            plan: plan,
            current_user: current_user
          ).call

          render json: { checkout_url: checkout_url }, status: :ok
        rescue ActiveRecord::RecordNotFound => e
          render json: { error: 'Empresa ou Plano não encontrado' }, status: :not_found
        rescue Pundit::NotAuthorizedError => e
          render json: { error: 'Você não tem permissão para realizar esta ação' }, status: :forbidden
        rescue ::Billing::Errors::PlanNotConfigured => e
          render json: { error: e.message }, status: :unprocessable_entity
        rescue ::Billing::Errors::StripeSessionCreationFailed => e
          render json: { error: e.message }, status: :service_unavailable
        rescue StandardError => e
          Rails.logger.error("Checkout creation error: #{e.message}")
          render json: { error: 'Erro interno ao iniciar sessão de checkout' }, status: :internal_server_error
        end
      end
    end
  end
end
