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

          BillingAuditLog.create!(
            user_id: current_user.id,
            company_id: company.id,
            action: :checkout_initiated,
            plan_id: plan.id,
            metadata: {
              ip_address: request.remote_ip,
              user_agent: request.user_agent,
              timestamp: Time.current.iso8601
            }
          )

          checkout_url = ::Billing::CheckoutService.new(
            company: company,
            plan: plan,
            current_user: current_user,
            success_url: params[:success_url],
            cancel_url: params[:cancel_url]
          ).call

          render json: { checkout_url: checkout_url }, status: :ok
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Empresa ou Plano não encontrado' }, status: :not_found
        rescue Pundit::NotAuthorizedError
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
