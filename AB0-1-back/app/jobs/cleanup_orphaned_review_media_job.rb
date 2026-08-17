# frozen_string_literal: true

class CleanupOrphanedReviewMediaJob < ApplicationJob
  queue_as :low

  def perform
    ReviewUploadSession
      .where(status: :active)
      .where('expires_at < ?', 24.hours.ago)
      .find_each do |session|
        session.review_media.find_each do |media|
          media.file.purge_later if media.file.attached?
          media.destroy!
        end
        session.update!(status: :abandoned)
      end
  end
end