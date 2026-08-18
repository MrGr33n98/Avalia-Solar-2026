class FavoriteSerializer
  def self.render(favorite)
    item = favorite.favoritable
    {
      id: favorite.id,
      favoritable_type: favorite.favoritable_type,
      favorited_at: favorite.created_at,
      item: item_payload(item)
    }
  end

  def self.item_payload(item)
    case item
    when Company
      {
        id: item.id,
        slug: item.slug,
        name: item.name,
        logo_url: item.logo_url,
        city: item.city,
        state: item.state,
        verified: item.verified,
        average_rating: item.rating_avg,
        rating_count: item.rating_count || item.reviews_count
      }
    when Product
      {
        id: item.id,
        slug: item.respond_to?(:slug) ? item.slug : nil,
        name: item.name,
        image_url: item.image_url,
        company: item.company ? {
          id: item.company.id,
          slug: item.company.slug,
          name: item.company.name,
          logo_url: item.company.logo_url
        } : nil,
        category: item.categories.first ? {
          id: item.categories.first.id,
          name: item.categories.first.name,
          seo_url: item.categories.first.seo_url
        } : nil
      }
    end
  end

  private_class_method :item_payload
end
