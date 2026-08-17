# frozen_string_literal: true

class ProcessReviewMediaJob < ApplicationJob
  queue_as :low

  retry_on ActiveStorage::FileNotFoundError, wait: 30.seconds, attempts: 3

  def perform(media_id)
    media = ReviewMedia.find(media_id)
    return unless media.file.attached?

    media.file.blob.analyze
    media.file.variant(resize_to_limit: [1600, 1600]).processed
    media.file.variant(resize_to_limit: [480, 480]).processed
    metadata = media.file.blob.reload.metadata || {}
    media.update!(
      status: :ready,
      content_type: media.file.blob.content_type,
      byte_size: media.file.blob.byte_size,
      width: metadata['width'],
      height: metadata['height']
    )
  rescue StandardError => e
    media&.update_columns(status: 'failed', metadata: (media.metadata || {}).merge('error' => e.class.name))
    raise
  end
end