module Reviewer
  class PublicSlugService
    def initialize(profile)
      @profile = profile
    end

    def call
      return @profile.public_slug if @profile.public_slug.present?

      base = I18n.transliterate(@profile.user.name.to_s).downcase.gsub(/[^a-z0-9]+/, '-').sub(/\A-|-$|/, '')
      base = 'reviewer' if base.blank?
      slug = base
      number = 1
      while ReviewerProfile.where(public_slug: slug).where.not(id: @profile.id).exists?
        number += 1
        slug = "#{base}-#{number}"
      end
      @profile.update!(public_slug: slug)
      slug
    end
  end
end
