# frozen_string_literal: true

module CompanyBadgesSerialization
  def badges
    public_badges.filter_map do |badge|
      {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        category: badge.category_label,
        year: badge.year,
        edition: badge.edition,
        public_slug: badge.public_slug,
        image_url: badge.image_url
      }
    rescue StandardError => e
      Rails.logger.error("Error serializing badge #{badge&.id} for company #{object.id}: #{e.message}")
      nil
    end
  end

  private

  def public_badges
    if object.association(:badges).loaded?
      object.badges.select(&:active?).sort_by { |badge| [badge.position || Float::INFINITY, badge.id] }
    else
      object.badges.active.order(position: :asc, id: :asc)
    end
  end
end
