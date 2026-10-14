# frozen_string_literal: true

module Api
  module V1
    module Company
      class InvitationsController < Api::V1::BaseController
        before_action :authenticate_api_user
        before_action :require_company_user
        before_action :set_company
        before_action :ensure_manager_or_owner!
        before_action :set_invitation, only: %i[resend destroy]

        def index
          invitations = @company.company_invitations.pending.includes(:invited_by).order(created_at: :desc)
          render json: {
            items: invitations.map { |inv| serialize_invitation(inv) }
          }
        end

        def create
          service = CompanyInvitationService.new(company: @company, invited_by: current_user)
          result = service.create(email: params[:email], role: params[:role])

          if result.success?
            render json: serialize_invitation(result.invitation), status: :created
          else
            render_error_response(
              message: result.error,
              status: :unprocessable_entity,
              code: 'INVITATION_FAILED'
            )
          end
        end

        def resend
          raw_token = @invitation.generate_token!
          if @invitation.save
            CompanyInvitationMailer.invite_email(@invitation.id, raw_token).deliver_later
            render json: serialize_invitation(@invitation)
          else
            render_error_response(
              message: 'Não foi possível reenviar o convite.',
              status: :unprocessable_entity,
              code: 'RESEND_FAILED'
            )
          end
        end

        def destroy
          @invitation.update!(status: 'revoked')
          head :no_content
        end

        private

        def set_company
          @company = current_effective_company
          render_error('Company not found', :not_found) unless @company
        end

        def set_invitation
          @invitation = @company.company_invitations.find(params[:id])
        end

        def ensure_manager_or_owner!
          membership = @company.company_members.active.find_by(user_id: current_user.id)
          is_authorized = membership&.owner? || membership&.manager?
          render_error('Forbidden', :forbidden) unless is_authorized
        end

        def serialize_invitation(inv)
          {
            id: inv.id,
            email: inv.email,
            role: inv.role,
            status: inv.status,
            expires_at: inv.expires_at&.iso8601,
            created_at: inv.created_at&.iso8601,
            invited_by: {
              id: inv.invited_by_id,
              name: inv.invited_by&.name,
              email: inv.invited_by&.email
            }
          }
        end
      end
    end
  end
end
