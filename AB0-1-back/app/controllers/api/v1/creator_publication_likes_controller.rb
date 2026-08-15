module Api
  module V1
    class CreatorPublicationLikesController < Api::V1::BaseController
      before_action :load_publication
      def show
        response.headers['Cache-Control'] = 'private, no-store'
        render json: payload
      end
      def create
        @publication.with_lock { @publication.reviewer_publication_likes.create_or_find_by!(identity) }
        render json: payload, status: :created
      rescue ActiveRecord::RecordNotUnique
        render json: payload
      end
      def destroy
        @publication.reviewer_publication_likes.where(identity).destroy_all
        render json: payload
      end
      private
      def load_publication
        @publication = profile&.user&.reviewer_publications&.published&.find_by(slug: params[:publication_slug])
        head :not_found unless @publication
      end
      def identity = current_user ? { user_id: current_user.id } : { visitor_key: visitor_key }
      def visitor_key = cookies.signed[:publication_visitor_key] ||= SecureRandom.hex(24)
      def payload
        { likes_count: @publication.reload.likes_count, liked: @publication.reviewer_publication_likes.exists?(identity) }
      end
    end
  end
end
