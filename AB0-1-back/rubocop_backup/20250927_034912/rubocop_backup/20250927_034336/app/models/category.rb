class Category < ApplicationRecord
  # =========================
  # Associations
  # =========================
  has_and_belongs_to_many :companies, join_table: :categories_companies
  has_and_belongs_to_many :products,  join_table: :categories_products
  has_one_attached :banner
  has_many :banners

  # =========================
  # Validations
  # =========================
  validates :name, presence: true, uniqueness: true
  validates :description, presence: true

  # =========================
  # Ransack configuration
  # =========================
  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id name description created_at updated_at
      featured status seo_url seo_title short_description
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[companies products banner_attachment banner_blob]
  end

  # =========================
  # JSON serialization
  # =========================
  def as_json(options = {})
    json = super(
      options.merge(
        include: {
          companies: { only: %i[id name about] }, # <-- inclui about
          products: { only: %i[id name price] }
        },
        except: %i[created_at updated_at]
      )
    )

    # Add banner URL if attached
    if banner.attached?
      begin
        json[:banner_url] = Rails.application.routes.url_helpers.rails_blob_url(banner, only_path: false)
      rescue StandardError => e
        Rails.logger.error("Error generating category banner URL: #{e.message}")
        json[:banner_url] = nil
      end
    else
      json[:banner_url] = nil
    end

    json
  end

  # =========================
  # URL helpers for banner attachment
  # =========================
  def banner_url
    return nil unless banner.attached?

    Rails.application.routes.url_helpers.rails_blob_url(banner, only_path: false)
  rescue StandardError => e
    Rails.logger.error("Error generating category banner URL: #{e.message}")
    nil
  end
end
