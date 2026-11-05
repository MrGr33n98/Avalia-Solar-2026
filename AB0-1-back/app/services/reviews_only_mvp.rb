# frozen_string_literal: true

# A reversible product-scope freeze. Production defaults to reviews-only, while
# existing social specs can opt in to the legacy experience without data changes.
module ReviewsOnlyMvp
  module_function

  def reviews_only?
    ENV.fetch('REVIEWS_ONLY_MVP', Rails.env.test? ? 'false' : 'true') != 'false'
  end

  def creator_enabled?
    !reviews_only? && ENV['CREATOR_EXPERIENCE_ENABLED'] == 'true'
  end

  def feed_enabled?
    !reviews_only? && ENV['SOCIAL_FEED_ENABLED'] == 'true'
  end
end
