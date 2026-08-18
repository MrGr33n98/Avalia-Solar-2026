require 'uri'

module Creator
  class PublicProfileService
    CACHE_VERSION = 'v3'

    def self.invalidate(profile)
      return unless profile&.public_slug.present?

      Rails.cache.delete("creator/public-profile/#{profile.public_slug}/v2")
      Rails.cache.delete("creator/public-profile/#{profile.public_slug}/#{CACHE_VERSION}")
    end

    def self.invalidate_for_user(user)
      invalidate(user.reviewer_profile) if user&.reviewer_profile&.creator_enabled?
    end

    def initialize(profile)
      @profile = profile
      @user = profile.user
    end

    def call
      Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
        { creator: creator, stats: stats, recent_publications: publications, recent_reviews: reviews,
          solutions: solutions, achievements: achievements }
      end
    end

    private

    def creator
      @profile.attributes.slice('public_slug', 'public_headline', 'public_bio', 'website_url', 'linkedin_url', 'instagram_url', 'youtube_url', 'whatsapp_url')
        .merge(name: @user.name, city: @user.city, state: @user.state, avatar_url: @user.respond_to?(:avatar_url) ? @user.avatar_url : nil, public_banner_url: @profile.public_banner.attached? ? Rails.application.routes.url_helpers.rails_blob_url(@profile.public_banner, host: ENV.fetch('APP_HOST', 'https://avaliasolar.com.br')) : nil)
    end

    def stats
      approved = @user.reviews.approved_only
      { review_count: approved.count, green_score: Rails.cache.fetch("creator/green-score/#{@user.id}/v1", expires_in: 10.minutes) { @user.calculate_green_score }, achievement_count: achievements.length }
    end

    def publications
      @user.reviewer_publications.published.select(:id, :title, :slug, :excerpt, :category, :publication_type, :published_at).order(published_at: :desc).limit(6).as_json(only: %i[id title slug excerpt category publication_type published_at])
    end

    def reviews
      @user.reviews.approved_only
        .select(:id, :user_id, :headline, :comment, :rating, :company_id, :category_id, :created_at, :verified,
                :project_type, :installation_status, :estimated_power, :is_legacy, :pros, :cons, :buyer_tip,
                :project_context, :content_metadata, :granular_scores_snapshot, :metadata)
        .includes(:company, :category, :user, review_media: { file_attachment: :blob })
        .order(created_at: :desc).limit(3).map do |review|
        {
          id: review.id,
          title: review.headline,
          excerpt: review.comment,
          headline: review.headline,
          comment: review.comment,
          rating: review.rating,
          created_at: review.created_at,
          verified: review.verified,
          is_legacy: review.is_legacy,
          project_type: review.project_type,
          installation_status: review.installation_status,
          estimated_power: review.estimated_power&.to_f,
          project_context: review.project_context,
          pros: review.pros,
          cons: review.cons,
          buyer_tip: review.buyer_tip,
          would_recommend: review.metadata&.[]('would_recommend'),
          user: { id: review.user&.id, name: review.user&.name || @user.name, avatar_url: review.user&.avatar_url },
          company: serialize_company(review.company),
          category_id: review.category_id,
          category_name: review.category&.name,
          granular_scores: serialize_granular_scores(review),
          media: serialize_media(review)
        }
      end
    end

    def serialize_company(company)
      return nil unless company

      { id: company.id, name: company.name, slug: company.slug, logo_url: company.logo_url }
    end

    def serialize_granular_scores(review)
      return review.granular_scores_snapshot if review.granular_scores_snapshot.present?

      review.review_criterion_scores.map do |score|
        {
          id: score.id,
          title: score.title_snapshot || score.rating_criterion&.title,
          score: score.score.to_f,
          weight: score.weight_snapshot || score.rating_criterion&.weight
        }
      end
    end

    def serialize_media(review)
      review.review_media.publicly_ready.ordered.filter_map do |media|
        next unless media.file.attached?

        {
          id: media.id,
          type: media.media_type,
          display_url: Rails.application.routes.url_helpers.rails_blob_url(
            media.file.variant(resize_to_limit: [1600, 1600]), public_url_options
          ),
          thumbnail_url: Rails.application.routes.url_helpers.rails_blob_url(
            media.file.variant(resize_to_limit: [480, 480]), public_url_options
          ),
          width: media.width,
          height: media.height,
          sort_order: media.sort_order
        }
      end
    rescue StandardError => e
      Rails.logger.warn("[CreatorProfile] failed to serialize review media: #{e.message}")
      []
    end

    def public_url_options
      origin = ENV['ACTIVE_STORAGE_HOST'].presence || ENV['APP_HOST'].presence ||
               (Rails.env.test? ? 'http://www.example.com' : 'https://api.avaliasolar.com.br')
      uri = URI.parse(origin)
      options = { host: uri.host || origin, protocol: uri.scheme || 'https' }
      options[:port] = uri.port if uri.port && ![80, 443].include?(uri.port)
      options
    end

    def solutions
      @user.reviewer_solutions.where(status: 'active').as_json
    end

    def achievements
      @achievements ||= @user.achievements.select { |achievement| achievement[:unlocked] }
    end

    def cache_key
      "creator/public-profile/#{@profile.public_slug}/#{CACHE_VERSION}"
    end
  end
end
