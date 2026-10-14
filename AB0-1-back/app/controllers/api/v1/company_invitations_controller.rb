# frozen_string_literal: true

module Api
  module V1
    class CompanyInvitationsController < BaseController
      before_action :authenticate_api_user, only: %i[accept]

      def verify
        raw_token = request.headers['X-Invitation-Token'].presence || params[:token]
        invitation = CompanyInvitation.find_by_token(raw_token)

        if invitation.nil? || invitation.expired?
          return render_error_response(
            message: 'Convite inválido ou expirado.',
            status: :not_found,
            code: 'INVITATION_INVALID'
          )
        end

        render json: {
          company_id: invitation.company_id,
          company_name: invitation.company.name,
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.expires_at&.iso8601
        }
      end

      def accept
        raw_token = request.headers['X-Invitation-Token'].presence || params[:token]
        invitation = CompanyInvitation.find_by_token(raw_token)

        if invitation.nil? || invitation.expired?
          return render_error_response(
            message: 'Convite inválido ou expirado.',
            status: :unprocessable_entity,
            code: 'INVITATION_INVALID'
          )
        end

        if invitation.accept!(current_user)
          current_user.update(company_id: invitation.company_id)
          cookies.signed[:active_company_id] = {
            value: invitation.company_id,
            httponly: true,
            secure: Rails.env.production?,
            same_site: :lax,
            expires: 30.days.from_now,
            path: '/'
          }

          render json: {
            message: 'Convite aceito com sucesso.',
            company_id: invitation.company_id,
            role: invitation.role
          }, status: :ok
        else
          render_error_response(
            message: 'Não foi possível aceitar o convite.',
            status: :unprocessable_entity,
            code: 'ACCEPT_FAILED'
          )
        end
      end
    end
  end
end
