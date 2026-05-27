module Api
  module V1
    module Billing
      class PortalController < Api::V1::BaseController
        before_action :authenticate_api_user

        def create
          company = ::Company.find(params[:company_id])

          # Autorização Pundit usando a classe de política explícita
          authorize company, :portal?, policy_class: BillingPolicy

          BillingAuditLog.create!(
            user_id: current_user.id,
            company_id: company.id,
            action: :portal_opened,
            metadata: {
              ip_address: request.remote_ip,
              user_agent: request.user_agent,
              timestamp: Time.current.iso8601
            }
          )

          portal_url = ::Billing::PortalService.new(company: company).call

          render json: { portal_url: portal_url }, status: :ok
        rescue ActiveRecord::RecordNotFound => e
          render json: { error: 'Empresa não encontrada' }, status: :not_found
        rescue Pundit::NotAuthorizedError => e
          render json: { error: 'Você não tem permissão para realizar esta ação' }, status: :forbidden
        rescue ::Billing::Errors::CompanySubscriptionMissing => e
          render json: { error: e.message }, status: :unprocessable_entity
        rescue ::Billing::Errors::StripeSessionCreationFailed => e
          render json: { error: e.message }, status: :service_unavailable
        rescue StandardError => e
          Rails.logger.error("Portal session creation error: #{e.message}")
          render json: { error: 'Erro interno ao iniciar sessão do portal de faturamento' }, status: :internal_server_error
        end
      end
    end
  end
end
