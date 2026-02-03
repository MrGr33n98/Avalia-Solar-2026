module Api
  module V1
    class CompanyAccessController < BaseController
      before_action :authenticate_api_user
      before_action :require_company_user

      def context
        active_memberships = current_user.active_company_members.includes(:company)
        pending_requests = current_user.company_access_requests.pending.includes(:company)

        active_company_ids = active_memberships.map(&:company_id)
        pending_company_ids = pending_requests.map(&:company_id)

        suggested_scope = Company.active_status
        if Company.respond_to?(:moderation_approved)
          suggested_scope = suggested_scope.where(moderation_status: 'approved')
        end
        suggested_scope = suggested_scope.where.not(id: active_company_ids + pending_company_ids)

        suggested_companies = suggested_scope.limit(8).select(:id, :name, :slug)

        render json: {
          active_memberships: active_memberships.map do |member|
            {
              company_id: member.company_id,
              company_name: member.company.name,
              company_slug: member.company.slug,
              member_role: member.role,
              member_status: member.status
            }
          end,
          pending_requests: pending_requests.map do |request|
            {
              id: request.id,
              company_id: request.company_id,
              company_name: request.company.name,
              status: request.status,
              requested_at: request.requested_at&.iso8601
            }
          end,
          suggested_companies: suggested_companies.map do |company|
            {
              company_id: company.id,
              company_name: company.name,
              company_slug: company.slug
            }
          end
        }, status: :ok
      end

      def select_active_company
        company_id = params[:company_id]
        unless current_user.active_membership_for?(company_id)
          return render_error_response(
            message: 'VocÃª nÃ£o possui acesso a esta empresa',
            status: :forbidden,
            code: 'FORBIDDEN_COMPANY'
          )
        end

        current_user.update(company_id: company_id)
        cookies.signed[:active_company_id] = {
          value: company_id,
          httponly: true,
          secure: Rails.env.production?,
          same_site: :lax,
          expires: 30.days.from_now,
          path: '/'
        }

        render json: {
          message: 'Empresa ativa selecionada com sucesso',
          company_id: company_id
        }, status: :ok
      end
    end
  end
end
