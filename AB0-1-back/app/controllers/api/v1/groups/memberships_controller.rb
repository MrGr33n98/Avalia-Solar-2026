# frozen_string_literal: true

module Api
  module V1
    module Groups
      class MembershipsController < BaseController
        before_action :authenticate_api_user
        before_action :ensure_groups_enabled!
        before_action :load_group

        def show
          membership = @group.group_memberships.find_by(user: current_user)
          return render json: { data: nil }, status: :ok unless membership

          authorize membership
          render json: { data: GroupMembershipSerializer.new(membership).as_json }
        end

        def create
          authorize @group, :join?
          membership = ::Groups::MembershipService.join(group: @group, user: current_user)
          render json: { data: GroupMembershipSerializer.new(membership).as_json }, status: :ok
        end

        def destroy
          authorize @group, :leave?
          membership = ::Groups::MembershipService.leave(group: @group, user: current_user)
          return render json: { data: nil }, status: :ok unless membership

          render json: { data: GroupMembershipSerializer.new(membership).as_json }, status: :ok
        end

        private

        def ensure_groups_enabled!
          return if ::Groups::Feature.enabled?

          render_error_response(message: 'Comunidades indisponíveis', status: :not_found, code: 'NOT_FOUND')
          false
        end

        def load_group
          policy_scope = ::GroupPolicy::Scope.new(current_user, ::Group)
          @group = if action_name == 'create'
                     policy_scope.resolve_for_join.find_by!(slug: params[:group_slug])
                   else
                     policy_scope.resolve.find_by!(slug: params[:group_slug])
                   end
          return if action_name == 'create'

          authorize @group, :show?
        end
      end
    end
  end
end