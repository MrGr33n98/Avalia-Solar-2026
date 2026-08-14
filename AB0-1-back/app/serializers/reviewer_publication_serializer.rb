class ReviewerPublicationSerializer
  def initialize(publication)
    @publication = publication
  end

  def as_json(*)
    {
      id: @publication.id, title: @publication.title, slug: @publication.slug,
      excerpt: @publication.excerpt, body: @publication.body, status: @publication.status,
      publication_type: @publication.publication_type, category: @publication.category,
      comments_enabled: @publication.comments_enabled, lead_capture_enabled: @publication.lead_capture_enabled,
      published_at: @publication.published_at&.iso8601, created_at: @publication.created_at&.iso8601,
      updated_at: @publication.updated_at&.iso8601,
      cover_image: attachment(@publication.cover_image),
      attachments: @publication.attachments.map { |file| attachment(file) },
      metrics: metrics
    }
  end

  private

  def metrics
    events = ReviewerPublicationEvent.where(reviewer_publication_id: @publication.id)
    { views: events.where(event_name: 'publication_view').count, comments: events.where(event_name: 'publication_comment').count, leads: events.where(event_name: 'publication_lead').count }
  end

  def attachment(file)
    return nil unless file&.attached?
    { id: file.id, filename: file.filename.to_s, content_type: file.content_type, byte_size: file.byte_size,
      url: Rails.application.routes.url_helpers.rails_blob_url(file, host: ENV.fetch('APP_HOST', 'https://avaliasolar.com.br')) }
  end
end
