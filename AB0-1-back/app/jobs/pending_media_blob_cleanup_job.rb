# frozen_string_literal: true

# Blobs are intentionally created before moderation so the reviewer can inspect
# the pending upload. A rejected change never attaches those blobs, therefore a
# post-commit cleanup is required to avoid accumulating paid storage forever.
class PendingMediaBlobCleanupJob < ApplicationJob
  queue_as :low

  def perform(pending_change_id)
    pending_change = PendingChange.find(pending_change_id)
    return unless pending_change.status == 'rejected' && pending_change.change_type == 'media'

    Array((pending_change.data || {})['signed_ids']).each do |signed_id|
      blob = ActiveStorage::Blob.find_signed!(signed_id)
      blob.purge if blob.attachments.none?
    rescue ActiveSupport::MessageVerifier::InvalidSignature, ActiveRecord::RecordNotFound
      # It may already have been purged or an old signed id may have expired.
      next
    end
  end
end
