class ProductSerializer < ActiveModel::Serializer
  attributes :id, :name, :description, :price, :company_id, :created_at, :updated_at,
             :short_description, :sku, :stock, :status, :featured, :seo_title, :seo_description,
             :image_url

  belongs_to :company
  has_many :categories

  def image_url
    return unless object.image.attached?

    Rails.application.routes.url_helpers.rails_blob_url(object.image, only_path: false)
  end
end
