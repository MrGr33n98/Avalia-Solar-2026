# frozen_string_literal: true

module Api
  module V1
    module Sales
      class BaseController < Api::V1::BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales
        rescue_from ActiveRecord::RecordNotFound, with: :sales_resource_not_found

        private

        def require_sales_surface_access!
          return if ::Sales::AuthorizationService.sales_access?(user: current_user)

          log_sales_denial(reason: 'sales_surface_forbidden', resource: 'SalesSurface')
          render_error_response(
            message: 'CRM interno requer autorização de vendas.',
            status: :forbidden,
            code: 'SALES_FORBIDDEN'
          )
        end
        alias_method :require_internal_sales, :require_sales_surface_access!

        def require_sales_permission!(resource, action)
          return if ::Sales::AuthorizationService.can?(user: current_user, resource: resource, action: action)

          log_sales_denial(reason: 'action_forbidden', resource: resource.to_s)
          render_error_response(
            message: "Ação não permitida para o recurso #{resource}.",
            status: :forbidden,
            code: 'SALES_FORBIDDEN'
          )
        end

        def current_tenant_scope
          ::Sales::TenantScope.new(user: current_user)
        end

        def sales_resource_not_found(_exception = nil)
          log_sales_denial(reason: 'resource_not_found_or_out_of_scope')
          render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
        end

        def render_relation_conflict(resource:)
          log_sales_denial(reason: 'incompatible_relation', resource: resource)
          render_error_response(
            message: 'As referências informadas não são compatíveis.',
            status: :unprocessable_entity,
            code: 'INCOMPATIBLE_RELATION'
          )
        end

        def log_sales_denial(reason:, resource: nil)
          Rails.logger.warn({
            event: 'sales_access_denied',
            request_id: request.request_id,
            action: action_name,
            resource_type: resource || controller_name.classify,
            reason: reason
          }.to_json)
        end
      end
    end
  end
end
