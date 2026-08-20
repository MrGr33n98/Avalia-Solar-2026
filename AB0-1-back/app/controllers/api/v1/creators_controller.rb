module Api
  module V1
    class CreatorsController < Api::V1::BaseController
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
        render json: profile.user.reviewer_publications.published.order(published_at: :desc).map { |publication| PublicCreatorPublicationSerializer.new(publication).as_json }
      end

      def publication
        profile = public_profile
        publication = profile&.user&.reviewer_publications&.published&.find_by(slug: params[:publication_slug])
        return head :not_found unless publication
        ReviewerPublicationEvent.create!(reviewer_publication: publication, event_name: 'publication_view', ip_address: request.remote_ip)
        render json: PublicCreatorPublicationSerializer.new(publication).as_json
      end

      def followers
        profile = public_profile
        return render json: { error: 'Creator não encontrado' }, status: :not_found unless profile

        limit = params[:limit].present? ? [params[:limit].to_i, 50].min : 10
        cursor_id = params[:cursor].present? ? params[:cursor].to_i : nil

        query = SocialFollow.where(followable: profile)
        query = query.where('id < ?', cursor_id) if cursor_id
        follows = query.order(id: :desc).limit(limit + 1).to_a

        has_more = follows.size > limit
        follows = follows.first(limit)
        next_cursor = has_more && follows.last ? follows.last.id.to_s : nil

        followers_data = follows.map do |follow|
          user = follow.follower
          prof = user.reviewer_profile
          {
            id: user.id,
            name: user.name,
            avatar_url: user.avatar_url,
            headline: prof&.public_headline || 'Avaliador Solar',
            public_slug: prof&.public_slug,
            following: current_user ? SocialFollow.exists?(follower: current_user, followable: prof) : false
          }
        end

        render json: {
          data: followers_data,
          meta: {
            next_cursor: next_cursor,
            has_more: has_more
          }
        }
      end

      def following
        profile = public_profile
        return render json: { error: 'Creator não encontrado' }, status: :not_found unless profile

        limit = params[:limit].present? ? [params[:limit].to_i, 50].min : 10
        cursor_id = params[:cursor].present? ? params[:cursor].to_i : nil

        query = SocialFollow.where(follower: profile.user)
        query = query.where('id < ?', cursor_id) if cursor_id
        follows = query.order(id: :desc).limit(limit + 1).to_a

        has_more = follows.size > limit
        follows = follows.first(limit)
        next_cursor = has_more && follows.last ? follows.last.id.to_s : nil

        following_data = follows.map do |follow|
          entity = follow.followable
          next nil unless entity

          if entity.is_a?(ReviewerProfile)
            {
              id: entity.id,
              type: 'ReviewerProfile',
              name: entity.user.name,
              avatar_url: entity.user.avatar_url,
              headline: entity.public_headline || 'Avaliador Solar',
              public_slug: entity.public_slug,
              following: current_user ? SocialFollow.exists?(follower: current_user, followable: entity) : false
            }
          elsif entity.is_a?(Company)
            {
              id: entity.id,
              type: 'Company',
              name: entity.name,
              avatar_url: entity.logo_url,
              headline: 'Empresa do setor solar',
              public_slug: entity.slug,
              following: current_user ? SocialFollow.exists?(follower: current_user, followable: entity) : false
            }
          else
            nil
          end
        end.compact

        render json: {
          data: following_data,
          meta: {
            next_cursor: next_cursor,
            has_more: has_more
          }
        }
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
