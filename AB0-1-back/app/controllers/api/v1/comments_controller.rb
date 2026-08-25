# frozen_string_literal: true

module Api
  module V1
    class CommentsController < BaseController
      skip_before_action :authenticate_user!, only: [:index], raise: false
      before_action :authenticate_user!, only: %i[create update destroy]

      def index
        commentable = find_commentable
        unless commentable
          return render json: { error: { code: 'NOT_FOUND', message: 'Item não encontrado' } }, status: :not_found
        end

        comments = Comment.where(commentable: commentable).active.root_comments.includes(:user, replies: :user).order(created_at: :asc)
        render json: { data: serialize_comments(comments) }
      end

      def create
        commentable = find_commentable
        unless commentable
          return render json: { error: { code: 'NOT_FOUND', message: 'Item não encontrado' } }, status: :not_found
        end

        comment = Comment.new(
          user: current_user,
          commentable: commentable,
          parent_id: params[:parent_id],
          body: params[:body],
          status: 'active'
        )

        authorize comment

        if comment.save
          render json: { status: 'success', data: serialize_comment(comment) }, status: :created
        else
          render json: { error: { code: 'VALIDATION_ERROR', message: comment.errors.full_messages.join(', ') } }, status: :unprocessable_entity
        end
      end

      def destroy
        comment = Comment.find(params[:id])
        authorize comment

        comment.update!(status: 'deleted', deleted_at: Time.current)
        render json: { status: 'success' }, status: :ok
      end

      private

      def find_commentable
        type = params[:commentable_type]
        id = params[:commentable_id]

        case type
        when 'ReviewerPublication' then ReviewerPublication.find_by(id: id)
        when 'Review' then Review.find_by(id: id)
        when 'GroupPost'
          post = GroupPost.find_by(id: id)
          return nil unless post

          group = post.group
          return nil unless group.status == 'active'

          if group.visibility == 'private_hidden' || group.visibility == 'private_visible'
            membership = group.active_membership_for(current_user)
            return nil unless membership.present?
          end

          if post.status != 'published'
            membership = group.active_membership_for(current_user)
            is_moderator = membership.present? && membership.role.in?(%w[moderator admin owner])
            return nil unless is_moderator || current_user&.admin?
          end

          post
        else nil
        end
      end

      def serialize_comments(comments)
        comments.map { |c| serialize_comment(c) }
      end

      def serialize_comment(comment)
        {
          id: comment.id,
          body: comment.status == 'deleted' ? '[Comentário removido]' : comment.body,
          status: comment.status,
          created_at: comment.created_at.iso8601,
          user: {
            id: comment.user_id,
            name: comment.user&.name
          },
          replies: (comment.replies.loaded? ? comment.replies : comment.replies.active).map { |r| serialize_comment(r) }
        }
      end
    end
  end
end
