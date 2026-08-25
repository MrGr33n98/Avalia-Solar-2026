# frozen_string_literal: true

module Api
  module V1
    module Groups
      class PostsController < BaseController
        skip_before_action :authenticate_user!, only: %i[index show], raise: false
        before_action :ensure_groups_enabled!
        before_action :authenticate_api_user, except: %i[index show]
        before_action :load_group
        before_action :load_post, only: %i[show update destroy hide restore pin unpin close_comments open_comments]

        def index
          posts = GroupPostPolicy::Scope.new(current_user, GroupPost).resolve
            .where(group: @group)
            .includes(:user, :group_topic)
          posts = filter_by_topic(posts)
          posts = params[:sort].to_s == 'oldest' ? posts.oldest : posts.recent
          posts = paginate(posts)

          render json: {
            data: posts.map { |post| GroupPostSerializer.new(post, current_user: current_user).as_json },
            meta: { pagination: pagination_metadata(posts) }
          }
        end

        def show
          authorize @post
          render json: { data: GroupPostSerializer.new(@post, current_user: current_user).as_json }
        end

        def create
          post = @group.group_posts.new(post_params.merge(user: current_user))
          authorize post
          GroupPost.transaction do
            post.save!
            increment_posts_count!
            publish_event('group_post_created', post)
          end
          render json: { data: GroupPostSerializer.new(post, current_user: current_user).as_json }, status: :created
        end

        def update
          authorize @post
          @post.update!(post_params)
          publish_event('group_post_updated', @post)
          render_post
        end

        def destroy
          authorize @post
          @post.update!(status: 'removed')
          publish_event('group_post_hidden', @post)
          render_post
        end

        def hide
          authorize @post
          @post.update!(status: 'hidden')
          publish_event('group_post_hidden', @post)
          render_post
        end

        def restore
          authorize @post
          @post.update!(status: 'published')
          publish_event('group_post_restored', @post)
          render_post
        end

        def pin
          authorize @post
          @post.update!(pinned: true)
          publish_event('group_post_pinned', @post)
          render_post
        end

        def unpin
          authorize @post
          @post.update!(pinned: false)
          publish_event('group_post_unpinned', @post)
          render_post
        end

        def close_comments
          authorize @post
          @post.update!(comments_enabled: false)
          publish_event('group_post_updated', @post)
          render_post
        end

        def open_comments
          authorize @post
          @post.update!(comments_enabled: true)
          publish_event('group_post_updated', @post)
          render_post
        end

        private

        def ensure_groups_enabled!
          return if ::Groups::Feature.enabled?

          render_error_response(message: 'Comunidades indisponíveis', status: :not_found, code: 'NOT_FOUND')
          false
        end

        def load_group
          @group = ::GroupPolicy::Scope.new(current_user, ::Group).resolve.find_by!(slug: params[:group_slug])
          authorize @group, :show?
        end

        def load_post
          posts = @group.group_posts
          posts = posts.where(status: 'published') unless GroupPolicy.new(current_user, @group).moderate?
          @post = posts.includes(:user, :group_topic).find(params[:id])
        end

        def filter_by_topic(posts)
          return posts unless params[:topic].present?

          topic = params[:topic].to_s
          if topic.match?(/\A\d+\z/)
            posts.where(group_topic_id: topic)
          else
            posts.joins(:group_topic).where(group_topics: { slug: topic })
          end
        end

        def increment_posts_count!
          @group.class.where(id: @group.id).update_all(
            @group.class.sanitize_sql_array(['posts_count = posts_count + 1, updated_at = ?', Time.current])
          )
          @group.reload
        end

        def post_params
          params.require(:post).permit(:title, :body, :group_topic_id)
        end

        def render_post
          render json: { data: GroupPostSerializer.new(@post, current_user: current_user).as_json }
        end

        def publish_event(event_type, post)
          DomainEvent.create!(
            event_type: event_type,
            aggregate_type: 'GroupPost',
            aggregate_id: post.id,
            payload: { group_id: post.group_id, user_id: post.user_id, status: post.status },
            occurred_at: Time.current
          )
        end
      end
    end
  end
end