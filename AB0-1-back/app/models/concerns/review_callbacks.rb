# frozen_string_literal: true

module ReviewCallbacks
  extend ActiveSupport::Concern

  included do
    after_commit :recalculate_company_rating, on: %i[create update destroy]
  end

  private

  def recalculate_company_rating
    return unless company_id_changed_for_commit? || saved_change_to_rating? || destroyed?

    company&.recalculate_rating_cache!
  rescue StandardError => e
    Rails.logger.error("Failed to recalculate rating cache for company #{company_id}: #{e.message}")
  end
end
