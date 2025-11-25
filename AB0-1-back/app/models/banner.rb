class Banner < ApplicationRecord
  belongs_to :category, optional: true
  has_one_attached :image

  validates :title, :banner_type, :position, presence: true
  validates :banner_type, inclusion: { in: %w[rectangular_large rectangular_small] }
  validates :position, inclusion: { in: %w[navbar sidebar] }
  validates :image, presence: true

  def self.ransackable_attributes(_auth_object = nil)
    %w[category_id created_at id image_url title updated_at link active sponsored
       banner_type position]
  end

  def self.ransackable_associations(_auth_object = nil)
    ['category']
  end

  scope :currently_active, lambda {
    scope = where(active: true)
    if column_names.include?('start_date')
      scope = scope.where('start_date IS NULL OR start_date <= ?', Time.current)
    end
    if column_names.include?('end_date')
      scope = scope.where('end_date IS NULL OR end_date >= ?', Time.current)
    end
    scope
  }

  def image_url
    return nil unless image.attached?
    Rails.application.routes.url_helpers.rails_blob_url(image, only_path: false)
  rescue StandardError => e
    Rails.logger.error("Error generating banner image URL: #{e.message}")
    nil
  end

  def as_json(options = {})
    super(options).merge(image_url: image_url)
  end
end
