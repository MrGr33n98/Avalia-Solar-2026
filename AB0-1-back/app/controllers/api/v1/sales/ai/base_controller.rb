# frozen_string_literal: true

module Api
  module V1
    module Sales
      module Ai
        class BaseController < Api::V1::Sales::BaseController
          private

          def current_company_id
            cid = current_user&.company_id
            return cid if cid.present?

            first_company = ::Company.order(:id).pick(:id)
            return first_company if first_company.present? && crm_admin?

            render_error_response(
              message: 'Usuário sem empresa associada para o CRM AI Studio.',
              status: :unprocessable_entity,
              code: 'COMPANY_REQUIRED'
            )
            nil
          end

          def crm_admin?
            return false unless current_user
            return true if current_user.is_a?(AdminUser) || (current_user.respond_to?(:admin?) && current_user.admin?)
            return true if ::Sales::AuthorizationService.can?(user: current_user, resource: :settings, action: :manage)

            current_user.sales_roles.where("LOWER(name) IN (?)", %w[admin sales_admin crm_admin manager]).exists?
          end

          def require_crm_admin!
            return if crm_admin?

            log_sales_denial(reason: 'crm_ai_admin_required', resource: 'SalesAiSettings')
            render_error_response(
              message: 'Apenas administradores do CRM podem alterar credenciais ou políticas de IA.',
              status: :forbidden,
              code: 'CRM_AI_ADMIN_REQUIRED'
            )
          end
        end
      end
    end
  end
end

