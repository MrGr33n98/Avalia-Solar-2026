module Api
  module V1
    class CreatorCommentsController < Api::V1::BaseController

      def index
        profile = ReviewerProfile.includes(:user).find_by!(public_slug: params[:creator_slug], creator_enabled: true)
        publication = profile.user.reviewer_publications.published.find_by!(slug: params[:publication_slug])
        comments = publication.reviewer_publication_comments.where(status: 'active').order(created_at: :desc).limit(100)
        render json: comments.map { |comment| comment.attributes.slice('id', 'name', 'body', 'created_at') }
      end

      def share
        profile = ReviewerProfile.includes(:user).find_by!(public_slug: params[:creator_slug], creator_enabled: true)
        publication = profile.user.reviewer_publications.published.find_by!(slug: params[:publication_slug])
        channel = params.dig(:share, :channel).to_s
        channel = 'unknown' unless %w[native copy linkedin whatsapp].include?(channel)
        ReviewerPublicationEvent.create!(reviewer_publication: publication, event_name: 'publication_share', channel: channel, ip_address: request.remote_ip)
        head :no_content
      end

      def create
        profile = ReviewerProfile.includes(:user).find_by!(public_slug: params[:creator_slug], creator_enabled: true)
        publication = profile.user.reviewer_publications.published.find_by!(slug: params[:publication_slug])
        return head :not_found unless publication.comments_enabled?
        return render json: { error: 'Comentário inválido.' }, status: :unprocessable_entity if params.dig(:comment, :website).present?
        return render json: { error: 'Muitas tentativas. Tente novamente em instantes.' }, status: :too_many_requests if publication.reviewer_publication_comments.where(ip_address: request.remote_ip).where('created_at > ?', 1.minute.ago).count >= 10
        comment = publication.reviewer_publication_comments.new(comment_params.merge(user: current_user, ip_address: request.remote_ip))
        return render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity unless comment.save
        ReviewerPublicationEvent.create!(reviewer_publication: publication, user: current_user, event_name: 'publication_comment', ip_address: request.remote_ip)
        render json: comment.attributes.slice('id', 'name', 'body', 'created_at'), status: :created
      end

      private
      def comment_params
        params.require(:comment).permit(:name, :email, :body, :website)
      end
    end
  end
end
