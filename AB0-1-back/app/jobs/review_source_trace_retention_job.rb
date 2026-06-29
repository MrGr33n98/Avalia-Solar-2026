class ReviewSourceTraceRetentionJob < ApplicationJob
  queue_as :low

  RETENTION_PERIOD = 90.days

  def perform
    Review.where(created_at: ...RETENTION_PERIOD.ago).select(:id, :metadata).find_each do |review|
      metadata = review.metadata || {}
      next unless metadata.key?('ip_hash')

      review.update_columns(
        metadata: metadata.except('ip_hash').merge('ip_hash_purged_at' => Time.current.iso8601),
        updated_at: Time.current
      )
    end
  end
end
