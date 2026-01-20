class ArticleSerializer < ActiveModel::Serializer
  attributes :id, :title, :slug, :content, :excerpt, :status, :published_at, :views_count,
             :meta_title, :meta_description, :featured, :image_url,
             :category_id, :product_id, :sponsored, :sponsored_label,
             :author_name, :author_email, :author_avatar_url,
             :created_at, :updated_at

  belongs_to :category
  belongs_to :product, if: -> { object.product_id.present? }
  has_many :companies

  def image_url
    object.banner.attached? ? Rails.application.routes.url_helpers.rails_blob_url(object.banner, only_path: false) : nil
  end

  def author_name
    object.author&.try(:name) || object.author&.try(:email)
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
