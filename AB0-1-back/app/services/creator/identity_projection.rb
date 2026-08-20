# frozen_string_literal: true

module Creator
  class IdentityProjection
    def self.resolve(profile)
      return nil unless profile

      user = profile.user
      banner_url = if profile.public_banner.attached?
                     Rails.application.routes.url_helpers.rails_blob_url(
                       profile.public_banner,
                       host: ENV.fetch('APP_HOST', 'https://avaliasolar.com.br')
                     )
                   end

      avatar_url = user.respond_to?(:avatar_url) ? user.avatar_url : nil

      {
        name: user.name,
        display_name: user.name,
        slug: profile.public_slug,
        public_slug: profile.public_slug,
        avatar: avatar_url,
        avatar_url: avatar_url,
        banner: banner_url,
        banner_url: banner_url,
        public_banner_url: banner_url,
        headline: profile.public_headline,
        public_headline: profile.public_headline,
        bio: profile.public_bio,
        public_bio: profile.public_bio,
        city: user.city,
        state: user.state,
        website_url: profile.website_url,
        linkedin_url: profile.linkedin_url,
        instagram_url: profile.instagram_url,
        youtube_url: profile.youtube_url,
        whatsapp_url: profile.whatsapp_url,
        gamification_level: user.gamification_level
      }
    end
  end
end
