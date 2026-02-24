class TrustScoreRecalculationWorker
  include Sidekiq::Job
  sidekiq_options queue: 'default'

  def perform(review_id)
    review = Review.find_by(id: review_id)
    return unless review

    Rails.logger.info "[TrustScoreRecalculationWorker] Recalculating for review #{review_id}"
    # Logic will be implemented in future stories
  end
end
