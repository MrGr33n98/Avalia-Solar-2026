class ProductSerializer < ActiveModel::Serializer
  attributes :id, :name, :description, :price, :company_id, :created_at, :updated_at,
             :short_description, :sku, :stock, :status, :featured, :seo_title, :seo_description,
             :image_url, :image_urls

  belongs_to :company
  has_many :categories

  def image_url
    return object[:image_url] unless object.images.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    Rails.application.routes.url_helpers.rails_storage_proxy_url(object.images.first, options)
  end

  def image_urls
    return [image_url].compact unless object.images.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    object.images.map do |image|
      Rails.application.routes.url_helpers.rails_storage_proxy_url(image, options)
    end
  end
end
