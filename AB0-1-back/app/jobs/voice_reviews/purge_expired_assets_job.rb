module VoiceReviews
  class PurgeExpiredAssetsJob < ApplicationJob
    queue_as :maintenance

    def perform(now = Time.current)
      VoiceReviewAsset.where('purge_after_at <= ?', now).where.not(status: 'purged').find_each do |asset|
        asset.purge!
      rescue StandardError => e
        Rails.logger.error("[VoiceReviews] asset purge failed asset=#{asset.id} error=#{e.class}")
      end

      VoiceReviewSession.where('expires_at <= ?', now)
                        .where.not(state: %w[completed submitted expired revoked abandoned failed_permanent])
                        .update_all(state: 'expired')
    end
  end
end
