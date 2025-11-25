class CategorySerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :name, :seo_url, :seo_title,
             :short_description, :description,
             :parent_id, :kind, :status, :featured,
             :created_at, :updated_at, :banner_url,
             :banner_sponsored, :banners

  has_many :companies
  has_many :products
  has_many :banners, serializer: BannerSerializer

  def banner_url
    return unless object.banner.attached?

    Rails.application.routes.url_helpers.rails_blob_url(object.banner, only_path: false)
  end

  def banners
    object.banners.map do |banner|
      {
        id: banner.id,
        title: banner.title,
        image_url: banner.image.attached? ? rails_blob_url(banner.image, only_path: false) : nil,
        link: banner.link,
        banner_type: banner.banner_type,
        position: banner.position,
        active: banner.active,
        sponsored: banner.sponsored
      }
    end
  end
end
