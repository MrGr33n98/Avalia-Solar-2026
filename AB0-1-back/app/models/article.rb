class Article < ApplicationRecord
  belongs_to :category
  belongs_to :product, optional: true
  belongs_to :company, optional: true

  scope :sponsored, -> { where(sponsored: true) }

  def sponsored?
    sponsored
  end

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[category_id company_id content created_at id product_id title updated_at sponsored sponsored_label]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category product company]
  end
end
