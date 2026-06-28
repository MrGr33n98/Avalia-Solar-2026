# frozen_string_literal: true

module ReviewCallbacks
  extend ActiveSupport::Concern

  included do
    before_save :update_score_from_criteria
    after_commit :recalculate_company_rating, on: %i[create update destroy]
    after_commit :trigger_trust_score_recalculation, on: %i[create update]
  end

  private

  def update_score_from_criteria
    self.rating = Reviews::ScoreCalculator.new(self).calculate
  end

  def recalculate_company_rating
    company_ids = []
    company_ids.push(company_id, company_id_before_last_save) if destroyed? || saved_change_to_company_id?
    company_ids << company_id if saved_change_to_rating?

    return if company_ids.compact.empty?

    company_ids.compact.uniq.each do |id|
      Company.find_by(id: id)&.recalculate_rating_cache!
    end
  rescue StandardError => e
    Rails.logger.error("Failed to recalculate rating cache for company #{company_id}: #{e.message}")
  end

  def trigger_trust_score_recalculation
    # Trigger trust score recalculation when:
    # 1. A new review is created
    # 2. A review status changes to approved
    # 3. A review rating changes

    return unless saved_change_to_status? || saved_change_to_rating? || new_record?

    # Only trigger for approved reviews
    return unless approved? || (new_record? && approved?)

    TrustScoreRecalculationWorker.perform_async(company_id, 'review')
  rescue StandardError => e
    Rails.logger.error("Failed to trigger trust score recalculation for company #{company_id}: #{e.message}")
  end
end
