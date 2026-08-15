class PublicCreatorPublicationSerializer
  def initialize(publication)
    @publication = publication
  end

  def as_json(*)
    { id: @publication.id, title: @publication.title, slug: @publication.slug, excerpt: @publication.excerpt,
      body: @publication.body, comments_enabled: @publication.comments_enabled, publication_type: @publication.publication_type, category: @publication.category,
      published_at: @publication.published_at&.iso8601, updated_at: @publication.updated_at&.iso8601,
      likes_count: @publication.likes_count, reading_time_minutes: [(@publication.body.to_s.split.size / 200.0).ceil, 1].max,
      cover_image: cover_image, attachments: attachments,
      author: { id: @publication.user_id, name: @publication.user.name },
      canonical_path: canonical_path }
  end

  private

  def attachments
    @publication.attachments.filter_map do |attachment|
      next unless attachment.content_type.start_with?('image/', 'application/pdf')
      { id: attachment.id, filename: attachment.filename.to_s, content_type: attachment.content_type, byte_size: attachment.byte_size,
        url: Rails.application.routes.url_helpers.rails_blob_url(attachment, host: ENV.fetch('APP_HOST', 'https://avaliasolar.com.br')) }
    end
  end

  def canonical_path
    "/creators/#{@publication.user.slug}/posts/#{@publication.slug}"
  end

  def cover_image
    return nil unless @publication.cover_image.attached?
    Rails.application.routes.url_helpers.rails_blob_url(@publication.cover_image, host: ENV.fetch('APP_HOST', 'https://avaliasolar.com.br'))
  end
end
