module Creator
  class PublicProfileService
    def self.invalidate(profile)
      Rails.cache.delete("creator/public-profile/#{profile.public_slug}/v2") if profile&.public_slug.present?
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
      @user.reviewer_publications.published.select(:id, :title, :slug, :excerpt, :category, :published_at).order(published_at: :desc).limit(6).as_json(only: %i[id title slug excerpt category published_at])
    end

    def reviews
      @user.reviews.approved_only.select(:id, :headline, :comment, :rating, :company_id, :created_at).includes(:company).order(created_at: :desc).limit(3).map do |review|
        { id: review.id, title: review.headline, excerpt: review.comment, rating: review.rating, company: review.company&.name, created_at: review.created_at }
      end
    end

    def solutions
      @user.reviewer_solutions.where(status: 'active').as_json
    end

    def achievements
      @achievements ||= @user.achievements.select { |achievement| achievement[:unlocked] }
    end

    def cache_key
      "creator/public-profile/#{@profile.public_slug}/v2"
    end
  end
end
