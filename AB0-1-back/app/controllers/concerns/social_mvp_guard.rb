# frozen_string_literal: true

# Server-side gate: hiding a tab in Next.js must not leave mutable social APIs
# exposed. Review submission, review votes and independent groups are untouched.
module SocialMvpGuard
  extend ActiveSupport::Concern

  private

  def require_creator_mvp_enabled!
    block_suspended_mvp_feature!('creator') unless ReviewsOnlyMvp.creator_enabled?
  end

  def require_feed_mvp_enabled!
    block_suspended_mvp_feature!('feed') unless ReviewsOnlyMvp.feed_enabled?
  end

  def block_suspended_mvp_feature!(feature)
    response.headers['Cache-Control'] = 'no-store'
    render json: {
      code: 'FEATURE_TEMPORARILY_DISABLED',
      feature: feature,
      message: 'Funcionalidade temporariamente indisponível no MVP de avaliações.'
    }, status: :forbidden
  end
end
