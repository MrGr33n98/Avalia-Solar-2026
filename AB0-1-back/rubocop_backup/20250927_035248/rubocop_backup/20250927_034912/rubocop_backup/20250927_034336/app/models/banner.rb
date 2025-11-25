class Banner < ApplicationRecord
  # =========================
  # Associations
  # =========================
  belongs_to :category, optional: true
  has_one_attached :image

  # =========================
  # Validations
  # =========================
  validates :title, :banner_type, :position, presence: true
  validates :banner_type, inclusion: { in: %w[rectangular_large rectangular_small] }
  validates :position, inclusion: { in: %w[navbar sidebar] }
  validates :image, presence: true

  # =========================
  # Ransack Configuration
  # =========================
  def self.ransackable_attributes(_auth_object = nil)
    %w[category_id created_at id image_url title updated_at link active sponsored
       banner_type position]
  end

  def self.ransackable_associations(_auth_object = nil)
    ['category']
  end
end
