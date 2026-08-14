module Api
  module V1
    class CreatorCommentsController < Api::V1::BaseController
      skip_before_action :authenticate_api_user, only: %i[index create]

      def index
        profile = ReviewerProfile.includes(:user).find_by!(public_slug: params[:creator_slug], creator_enabled: true)
        publication = profile.user.reviewer_publications.published.find_by!(slug: params[:publication_slug])
        comments = publication.reviewer_publication_comments.where(status: 'active').order(created_at: :desc)
        render json: comments.map { |comment| comment.attributes.slice('id', 'name', 'body', 'created_at') }
      end

      def create
        profile = ReviewerProfile.includes(:user).find_by!(public_slug: params[:creator_slug], creator_enabled: true)
        publication = profile.user.reviewer_publications.published.find_by!(slug: params[:publication_slug])
        return head :not_found unless publication.comments_enabled?
        comment = publication.reviewer_publication_comments.new(comment_params.merge(user: current_user))
        return render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity unless comment.save
        render json: comment.attributes.slice('id', 'name', 'body', 'created_at'), status: :created
      end

      private
      def comment_params
        params.require(:comment).permit(:name, :email, :body)
      end
    end
  end
end
