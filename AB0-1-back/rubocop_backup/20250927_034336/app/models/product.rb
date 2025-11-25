# app/models/product.rb
class Product < ApplicationRecord
  # Associations
  belongs_to :company, optional: true
  has_and_belongs_to_many :categories
  has_one_attached :image

  # Validations
  validates :name, :price, presence: true

  # Method to get image URL
  def image_url
    return nil unless image.attached?

    Rails.application.routes.url_helpers.url_for(image)
  end

  # Ransack configuration
  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id name description short_description price stock sku
      status featured seo_title seo_description
      company_id created_at updated_at
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company categories image_attachment image_blob]
  end

  # Custom JSON
  def as_json(options = {})
    super(options.merge(
      include: {
        categories: { only: %i[id name] },
        company: { only: %i[id name] }
      },
      methods: [:image_url],
      except: %i[created_at updated_at]
    ))
  end
end
