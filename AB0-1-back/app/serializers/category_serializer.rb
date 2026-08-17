class CategorySerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :name, :seo_url, :seo_title, :seo_keywords, :seo_description,
             :short_description, :description,
             :parent_id, :kind, :status, :featured,
             :average_rating, :reviews_count, :articles_count,
             :companies_count, :products_count,
             :created_at, :updated_at, :banner_url, :icon_url, :home_carousel_banner_url,
             :visual_key,
             :parent, :subcategories, :faqs, :solution_types
  # :banner_sponsored, :banners  # Temporarily commented out

  # Remove has_many associations that cause N+1 queries and complex serialization
  # has_many :companies
  # has_many :products
  # has_many :banners, serializer: BannerSerializer  # Commented out - BannerSerializer not found

  def reviews_count
    object.total_reviews_count
  end

  def visual_key
    object.respond_to?(:visual_key) ? object.visual_key : nil
  end

  def solution_types
    return [] unless object.respond_to?(:category_solution_types)

    object.category_solution_types.active.ordered.map do |solution|
      {
        id: solution.id,
        name: solution.name,
        slug: solution.slug,
        short_description: solution.short_description,
        description: solution.description,
        visual_key: solution.visual_key,
        technology_family: solution.technology_family,
        speed_class: solution.speed_class,
        position: solution.position,
        featured: solution.featured,
        attributes: solution.attributes_json,
        use_cases: solution.use_cases
      }
    end
  end

  def articles_count
    map = instance_options[:articles_count_map]
    return map[object.id] if map

    object.articles.published.count
  end

  def banner_url
    return unless object.banner.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    Rails.application.routes.url_helpers.rails_storage_proxy_url(object.banner, options)
  end

  def icon_url
    return unless object.icon.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    Rails.application.routes.url_helpers.rails_storage_proxy_url(object.icon, options)
  end

  def home_carousel_banner_url
    return unless object.home_carousel_banner.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    Rails.application.routes.url_helpers.rails_storage_proxy_url(object.home_carousel_banner, options)
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
  #     options = Rails.application.routes.default_url_options.dup
  #     options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
  #     {
  #       id: banner.id,
  #       title: banner.title,
  #       image_url: banner.image.attached? ? rails_storage_proxy_url(banner.image, options) : nil,
  #       link: banner.link,
  #       banner_type: banner.banner_type,
  #       position: banner.position,
  #       active: banner.active,
  #       sponsored: banner.sponsored
  #     }
  #   end
  # end

  def faqs
    faq_list = if object.association(:category_faqs).loaded?
                 object.category_faqs.select(&:published?).sort_by { |f| f.position || 999 }
               else
                 object.category_faqs.published_only.ordered
               end

    faq_list.map do |faq|
      {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        position: faq.position
      }
    end
  end
end
