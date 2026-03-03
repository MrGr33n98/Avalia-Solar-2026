# frozen_string_literal: true

module ReviewCallbacks
  extend ActiveSupport::Concern

  included do
    after_commit :recalculate_company_rating, on: %i[create update destroy]
  end

  private

  def recalculate_company_rating
    company_ids = []
    company_ids.concat([company_id, company_id_before_last_save]) if destroyed? || saved_change_to_company_id?
    company_ids << company_id if saved_change_to_rating?

    return if company_ids.compact.empty?

    company_ids.compact.uniq.each do |id|
      Company.find_by(id: id)&.recalculate_rating_cache!
    end
  rescue StandardError => e
    Rails.logger.error("Failed to recalculate rating cache for company #{company_id}: #{e.message}")
  end
end
