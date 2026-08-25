# frozen_string_literal: true

module Api
  module V1
    module Groups
      class MembershipRequestsController < BaseController
        before_action :authenticate_api_user
        before_action :ensure_groups_enabled!
        before_action :load_group

        def index
          authorize @group, :manage_members?
          requests = @group.group_memberships.where(status: 'pending').includes(:user).order(created_at: :asc)
          render json: { data: requests.map { |r| GroupMembershipSerializer.new(r).as_json } }
        end

        def approve
          authorize @group, :manage_members?
          membership = @group.group_memberships.find(params[:id])
          
          ::Groups::MembershipService.approve(membership: membership, approver: current_user)
          render json: { status: 'success', data: GroupMembershipSerializer.new(membership).as_json }, status: :ok
        end

        def reject
          authorize @group, :manage_members?
          membership = @group.group_memberships.find(params[:id])

          ::Groups::MembershipService.reject(membership: membership, rejecter: current_user)
          render json: { status: 'success', data: GroupMembershipSerializer.new(membership).as_json }, status: :ok
        end

        private

        def ensure_groups_enabled!
          return if ::Groups::Feature.enabled?

          render_error_response(message: 'Comunidades indisponíveis', status: :not_found, code: 'NOT_FOUND')
          false
        end

        def load_group
          @group = ::GroupPolicy::Scope.new(current_user, ::Group).resolve.find_by!(slug: params[:group_slug])
        end
      end
    end
  end
end
