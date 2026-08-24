module Api
  module V1
    class CreatorsController < Api::V1::BaseController
      around_action :log_creator_request
      def index
        profiles = ReviewerProfile.where(creator_enabled: true).includes(:user).order(id: :desc)

        if params[:q].present?
          term = "%#{ActiveRecord::Base.sanitize_sql_like(params[:q].to_s.strip)}%"
          profiles = profiles.joins(:user).where(
            'users.name ILIKE :term OR reviewer_profiles.public_headline ILIKE :term OR reviewer_profiles.public_bio ILIKE :term',
            term: term
          )
        end

        limit = [[params.fetch(:limit, 24).to_i, 1].max, 60].min
        profiles = profiles.limit(limit)
        render json: profiles.map { |profile| creator_card(profile) }
      end

      def show
        profile = public_profile
        return render json: { error: 'Creator não encontrado' }, status: :not_found unless profile

        render json: Creator::PublicProfileService.new(profile).call
      end

      def publications
        profile = public_profile
        return head :not_found unless profile

        render json: profile.user.reviewer_publications.published.order(published_at: :desc).map { |publication|
          PublicCreatorPublicationSerializer.new(publication).as_json
        }
      end

      def publication
        profile = public_profile
        publications = profile&.user&.reviewer_publications
        publication = publications&.published&.find_by(slug: params[:publication_slug])
        return head :not_found unless publication

        ReviewerPublicationEvent.create!(reviewer_publication: publication, event_name: 'publication_view',
                                         ip_address: request.remote_ip)
        render json: PublicCreatorPublicationSerializer.new(publication).as_json
      end

      def followers
        profile = public_profile
        return render json: { error: 'Creator não encontrado' }, status: :not_found unless profile

        query = SocialFollow
                .where(followable: profile)
                .includes(follower: [:reviewer_profile, { avatar_attachment: :blob }])
        page = paginated_follows(query)
        follows = page[:records]
        profiles = follows.filter_map { |follow| follow.follower.reviewer_profile }
        following_ids = following_ids_for('ReviewerProfile', profiles.map(&:id))
        followers_data = follows.map { |follow| serialize_follower(follow, following_ids) }

        render json: { data: followers_data, meta: page[:meta] }
      end

      def following
        profile = public_profile
        return render json: { error: 'Creator não encontrado' }, status: :not_found unless profile

        page = paginated_follows(SocialFollow.where(follower: profile.user))
        follows = page[:records]
        entities = followable_entities(follows)
        following_keys = following_keys_for(follows)

        following_data = follows.filter_map do |follow|
          key = [follow.followable_type, follow.followable_id]
          serialize_followable(entities[key], following_keys.key?(key))
        end

        render json: { data: following_data, meta: page[:meta] }
      end

      private

      def log_creator_request
        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        yield
      ensure
        duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round
        message = "[CreatorAPI] action=#{action_name} slug=#{params[:slug]} " \
                  "status=#{response.status} duration_ms=#{duration_ms}"
        Rails.logger.info(message)
      end

      def paginated_follows(query)
        limit = params[:limit].present? ? [params[:limit].to_i, 50].min : 10
        cursor_id = params[:cursor].present? ? params[:cursor].to_i : nil
        query = query.where('id < ?', cursor_id) if cursor_id
        records = query.order(id: :desc).limit(limit + 1).to_a
        has_more = records.size > limit
        records = records.first(limit)

        {
          records: records,
          meta: {
            next_cursor: has_more && records.last ? records.last.id.to_s : nil,
            has_more: has_more
          }
        }
      end

      def serialize_follower(follow, following_ids)
        user = follow.follower
        profile = user.reviewer_profile
        {
          id: user.id,
          followable_id: profile&.id,
          type: 'ReviewerProfile',
          name: user.name,
          avatar_url: user.avatar_url,
          headline: profile&.public_headline || 'Avaliador Solar',
          public_slug: profile&.public_slug,
          following: profile.present? && following_ids.key?(profile.id)
        }
      end

      def following_ids_for(type, ids)
        return {} if current_user.blank? || ids.empty?

        SocialFollow
          .where(follower: current_user, followable_type: type, followable_id: ids)
          .pluck(:followable_id)
          .index_with(true)
      end

      def following_keys_for(follows)
        return {} if current_user.blank?

        follows.group_by(&:followable_type).each_with_object({}) do |(type, typed_follows), keys|
          ids = typed_follows.map(&:followable_id)
          following_ids_for(type, ids).each_key { |id| keys[[type, id]] = true }
        end
      end

      def followable_entities(follows)
        ids_by_type = follows.group_by(&:followable_type).transform_values do |typed_follows|
          typed_follows.map(&:followable_id)
        end

        entities = {}
        ::ReviewerProfile
          .includes(user: { avatar_attachment: :blob })
          .where(id: ids_by_type.fetch('ReviewerProfile', []))
          .find_each { |profile| entities[['ReviewerProfile', profile.id]] = profile }
        ::Company
          .with_attached_logo
          .where(id: ids_by_type.fetch('Company', []))
          .find_each { |company| entities[['Company', company.id]] = company }
        entities
      end

      def serialize_followable(entity, is_following)
        case entity
        when ::ReviewerProfile
          serialize_reviewer_profile(entity, is_following)
        when ::Company
          serialize_company(entity, is_following)
        end
      end

      def serialize_reviewer_profile(profile, is_following)
        {
          id: profile.id,
          type: 'ReviewerProfile',
          name: profile.user.name,
          avatar_url: profile.user.avatar_url,
          headline: profile.public_headline || 'Avaliador Solar',
          public_slug: profile.public_slug,
          following: is_following
        }
      end

      def serialize_company(company, is_following)
        {
          id: company.id,
          type: 'Company',
          name: company.name,
          avatar_url: company.logo_url,
          headline: 'Empresa do setor solar',
          public_slug: company.slug,
          following: is_following
        }
      end

      def public_profile
        ::ReviewerProfile.includes(:user).find_by(public_slug: params[:slug], creator_enabled: true)
      end

      def creator_card(profile)
        identity = Creator::IdentityProjection.resolve(profile)
        {
          public_slug: profile.public_slug,
          name: identity[:name],
          public_headline: identity[:public_headline],
          public_bio: identity[:public_bio].to_s.truncate(180),
          avatar_url: identity[:avatar_url],
          city: identity[:city],
          state: identity[:state],
          stats: {
            review_count: profile.user.reviews.approved_only.count,
            publication_count: profile.user.reviewer_publications.published.count
          }
        }
      end
    end
  end
end
