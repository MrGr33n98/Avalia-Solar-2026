class PublicCreatorPublicationSerializer
  def initialize(publication)
    @publication = publication
  end

  def as_json(*)
    { id: @publication.id, title: @publication.title, slug: @publication.slug, excerpt: @publication.excerpt,
      body: @publication.body, comments_enabled: @publication.comments_enabled, publication_type: @publication.publication_type, category: @publication.category,
      published_at: @publication.published_at&.iso8601, updated_at: @publication.updated_at&.iso8601,
      cover_image: cover_image }
  end

  private

  def cover_image
    return nil unless @publication.cover_image.attached?
    Rails.application.routes.url_helpers.rails_blob_url(@publication.cover_image, host: ENV.fetch('APP_HOST', 'https://avaliasolar.com.br'))
  end
end
