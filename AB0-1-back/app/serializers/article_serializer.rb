class ArticleSerializer < ActiveModel::Serializer
  attributes :id, :title, :slug, :content, :excerpt, :status, :published_at, :views_count,
             :meta_title, :meta_description, :featured, :image_url, :cover_image_url,
             :reading_time_minutes, :published_date,
             :category_id, :product_id, :sponsored, :sponsored_label,
             :author, :author_name, :author_email, :author_avatar_url, :author_bio,
             :created_at, :updated_at

  belongs_to :category
  belongs_to :product, if: -> { object.product_id.present? }
  has_many :companies

  def image_url
    object.banner.attached? ? Rails.application.routes.url_helpers.rails_blob_url(object.banner, only_path: false) : nil
  end

  def cover_image_url
    image_url
  end

  def reading_time_minutes
    text = ActionView::Base.full_sanitizer.sanitize(object.content.to_s)
    words = text.scan(/\w+/).size
    return nil if words.zero?

    [(words / 200.0).ceil, 1].max
  end

  def published_date
    return nil unless object.published_at

    I18n.l(object.published_at.to_date, format: :long)
  rescue StandardError
    object.published_at.strftime('%d/%m/%Y')
  end

  def author
    return nil unless object.author

    {
      id: object.author.id,
      name: object.author&.try(:name).presence,
      avatar_url: author_avatar_url,
      bio: object.author&.try(:bio)
    }
  end

  def author_name
    object.author&.try(:name).presence
  end

  def author_email
    object.author&.try(:email)
  end

  def author_avatar_url
    return nil unless object.author&.avatar_photo&.attached?
    Rails.application.routes.url_helpers.rails_blob_url(
      object.author.avatar_photo.variant(resize_to_fill: [150, 150]),
      only_path: false
    )
  end

  def author_bio
    object.author&.try(:bio)
  end
end
