module Api
  module V1
    module Billing
      class EnterpriseLeadsController < Api::V1::BaseController
        before_action :authenticate_api_user

        def create
          company = ::Company.find(params[:company_id])
          plan = ::Plan.find(params[:plan_id])

          # Autoriza Pundit
          authorize company, :enterprise_lead?, policy_class: BillingPolicy

          lead_params = params.permit(:justification, :phone_contact, :estimated_mrr)
          
          # Validação básica de parâmetros exigidos para o lead
          if lead_params[:justification].blank? || lead_params[:phone_contact].blank?
            return render json: { error: 'Justificativa e telefone de contato são obrigatórios.' }, status: :unprocessable_entity
          end

          subscription = ::Billing::EnterpriseLeadService.new(
            company: company,
            plan: plan,
            current_user: current_user,
            params: lead_params
          ).call

          render json: { 
            message: 'Solicitação Enterprise registrada com sucesso! Nosso time comercial entrará em contato.',
            subscription_id: subscription.id 
          }, status: :created
        rescue ActiveRecord::RecordNotFound => e
          render json: { error: 'Empresa ou Plano não encontrado' }, status: :not_found
        rescue Pundit::NotAuthorizedError => e
          render json: { error: 'Você não tem permissão para realizar esta ação' }, status: :forbidden
        rescue StandardError => e
          Rails.logger.error("Enterprise Lead creation error: #{e.message}")
          render json: { error: 'Erro interno ao processar solicitação Enterprise' }, status: :internal_server_error
        end
      end
    end
  end
end
