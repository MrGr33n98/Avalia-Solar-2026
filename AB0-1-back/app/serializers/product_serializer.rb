class ProductSerializer < ActiveModel::Serializer
  attributes :id, :name, :description, :price, :company_id, :created_at, :updated_at,
             :short_description, :sku, :stock, :status, :featured, :seo_title, :seo_description,
             :image_url

  belongs_to :company
  has_many :categories

  def image_url
    return unless object.image.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    Rails.application.routes.url_helpers.rails_storage_proxy_url(object.image, options)
  end
end
