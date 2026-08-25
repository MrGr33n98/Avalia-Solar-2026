# frozen_string_literal: true

module Api
  module V1
    class GroupsController < BaseController
      skip_before_action :authenticate_user!, only: %i[index show], raise: false
      before_action :ensure_groups_enabled!
      before_action :authenticate_api_user, only: %i[create update]
      before_action :load_group, only: %i[show update]

      def index
        authorize Group
        groups = ::Groups::DiscoveryQuery.new(
          search: params[:search],
          category_id: params[:category],
          featured: params[:featured],
          view: params[:view]
        ).call
        render json: { data: groups.map { |group| GroupCompactSerializer.new(group, current_user: current_user).as_json } }
      end

      def show
        authorize @group
        render json: { data: GroupSerializer.new(@group, current_user: current_user).as_json }
      end

      def create
        authorize Group
        group = ::Groups::GroupCreationService.call(attributes: create_group_params, owner: current_user)
        render json: { data: GroupSerializer.new(group, current_user: current_user).as_json }, status: :created
      end

      def update
        authorize @group
        @group.update!(update_group_params)
        render json: { data: GroupSerializer.new(@group, current_user: current_user).as_json }
      end

      private

      def ensure_groups_enabled!
        return if ::Groups::Feature.enabled?

        render_error_response(message: 'Comunidades indisponíveis', status: :not_found, code: 'NOT_FOUND')
        false
      end

      def load_group
        @group = GroupPolicy::Scope.new(current_user, Group).resolve.find_by!(slug: params[:slug])
      end

      def create_group_params
        params.require(:group).permit(:name, :slug, :description, :short_description, :visibility,
                                      :membership_mode, :posting_mode, :category_id)
      end

      def update_group_params
        params.require(:group).permit(:name, :description, :short_description, :visibility,
                                      :membership_mode, :posting_mode, :category_id)
      end
    end
  end
end