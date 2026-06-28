# frozen_string_literal: true

module Chat
  class CompanyMatchingService
    def self.match(profile)
      p = profile.is_a?(Hash) ? OpenStruct.new(profile) : profile

      # Base Query
      query = Company.active.where(public_profile: true)

      # Filter by Vertical
      query = query.where(vertical: p.vertical) if p.vertical.present? && p.vertical != 'unknown'

      # Filter by State (Location is critical)
      query = query.where(state: p.state) if p.state.present?

      # Initial Match
      matches = query.includes(:reviews).to_a

      # Rank Matches
      matches.sort_by! do |c|
        score = 0

        # Priority 1: Exact City
        score += 1000 if p.city.present? && c.city&.downcase == p.city.downcase

        # Priority 2: Category Match (if services/categories are stored in JSON or join table)
        # Assuming Category association exists and can be checked
        score += 500 if p.category.present? && c.categories.map(&:seo_url).include?(p.category)

        # Priority 3: Reputation/Rating
        score += (c.average_rating || 0) * 10
        score += c.reviews.count || 0

        # Priority 4: Verified Badge
        score += 200 if c.verified?

        -score # Negative for descending sort
      end

      matches
    end
  end
end
