class BadgeSerializer < ActiveModel::Serializer
  attributes :id, :name, :image_url, :year, :edition

  def image_url
    return unless object.badge_image.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    Rails.application.routes.url_helpers.rails_storage_proxy_url(object.badge_image, options)
  end
end
