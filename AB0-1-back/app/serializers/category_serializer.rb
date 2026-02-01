class CategorySerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :name, :seo_url, :seo_title,
             :short_description, :description,
             :parent_id, :kind, :status, :featured,
             :average_rating, :reviews_count,
             :companies_count, :products_count,
             :created_at, :updated_at, :banner_url, :icon_url,
             :parent, :subcategories
             # :banner_sponsored, :banners  # Temporarily commented out

  has_many :companies
  has_many :products
  # has_many :banners, serializer: BannerSerializer  # Commented out - BannerSerializer not found

  def reviews_count
    object.total_reviews_count
  end

  def banner_url
    return unless object.banner.attached?

    Rails.application.routes.url_helpers.rails_blob_url(object.banner, only_path: false)
  end

  def icon_url
    return unless object.icon.attached?

    Rails.application.routes.url_helpers.rails_blob_url(object.icon, only_path: false)
  end

  def parent
    return nil unless object.parent

    {
      id: object.parent.id,
      name: object.parent.name,
      seo_url: object.parent.seo_url
    }
  end

  def subcategories
    object.children.order(:name).map do |child|
      {
        id: child.id,
        name: child.name,
        seo_url: child.seo_url,
        featured: child.featured,
        status: child.status
      }
    end
  end

  # Temporarily commented out to fix the search issue
  # def banners
  #   object.banners.map do |banner|
  #     {
  #       id: banner.id,
  #       title: banner.title,
  #       image_url: banner.image.attached? ? rails_blob_url(banner.image, only_path: false) : nil,
  #       link: banner.link,
  #       banner_type: banner.banner_type,
  #       position: banner.position,
  #       active: banner.active,
  #       sponsored: banner.sponsored
  #     }
  #   end
  # end
end
