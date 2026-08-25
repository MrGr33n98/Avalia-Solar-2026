# frozen_string_literal: true

module Api
  module V1
    class GroupsController < BaseController
      skip_before_action :authenticate_user!, only: %i[index show], raise: false
      before_action :ensure_groups_enabled!
      before_action :authenticate_api_user, only: %i[create update]
      before_action :load_group, only: %i[show update]

      def index
        if params[:view] == 'mine'
          return if authenticate_api_user == false
        end
        authorize Group
        groups = ::Groups::DiscoveryQuery.new(
          search: params[:search],
          category_id: params[:category],
          featured: params[:featured],
          view: params[:view],
          current_user: current_user
        ).call
        render json: { data: groups.map { |group| GroupCompactSerializer.new(group, current_user: current_user).as_json } }
      end

      def recommendations
        authorize Group, :index?
        limit = (params[:limit] || 5).to_i
        groups = ::Groups::RecommendationService.call(user: current_user, limit: limit)
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

      def analytics
        authorize @group, :moderate?

        days = (params[:period] || 30).to_i
        days = 30 unless days.in?([7, 30, 90])
        start_date = days.days.ago

        post_ids = @group.group_posts.pluck(:id)

        total_members = @group.members_count
        new_members = @group.group_memberships.where(status: 'active').where('joined_at >= ?', start_date).count
        posts_count = @group.group_posts.published.where('created_at >= ?', start_date).count
        comments_count = Comment.where(commentable_type: 'GroupPost', commentable_id: post_ids).active.where('created_at >= ?', start_date).count
        reactions_count = Reaction.where(reactable_type: 'GroupPost', reactable_id: post_ids).where('created_at >= ?', start_date).count

        posted_user_ids = @group.group_posts.where('created_at >= ?', start_date).pluck(:user_id)
        commented_user_ids = Comment.where(commentable_type: 'GroupPost', commentable_id: post_ids).active.where('created_at >= ?', start_date).pluck(:user_id)
        active_contributors = (posted_user_ids + commented_user_ids).uniq.count

        render json: {
          data: {
            total_members: total_members,
            new_members: new_members,
            posts_count: posts_count,
            comments_count: comments_count,
            reactions_count: reactions_count,
            active_contributors: active_contributors,
            period_days: days
          }
        }
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