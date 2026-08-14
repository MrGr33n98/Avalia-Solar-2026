module Api
  module V1
    class CreatorsController < Api::V1::BaseController
      skip_before_action :authenticate_api_user, only: %i[index show publications publication]
      around_action :log_creator_request
      def index
        render json: ReviewerProfile.where(creator_enabled: true).select(:public_slug, :creator_enabled)
      end


      def show
        profile = public_profile
        return render json: { error: 'Creator não encontrado' }, status: :not_found unless profile
        render json: Creator::PublicProfileService.new(profile).call
      end

      def publications
        profile = public_profile
        return head :not_found unless profile
        render json: profile.user.reviewer_publications.published.order(published_at: :desc)
      end

      def publication
        profile = public_profile
        publication = profile&.user&.reviewer_publications&.published&.find_by(slug: params[:publication_slug])
        return head :not_found unless publication
        render json: publication
      end

      private

      def log_creator_request
        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        yield
      ensure
        duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round
        Rails.logger.info("[CreatorAPI] action=#{action_name} slug=#{params[:slug]} status=#{response.status} duration_ms=#{duration_ms}")
      end

      def public_profile
        ReviewerProfile.includes(:user).find_by(public_slug: params[:slug], creator_enabled: true)
      end
    end
  end
end
