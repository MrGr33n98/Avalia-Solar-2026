# app/models/product.rb
class Product < ApplicationRecord
  # Associations
  belongs_to :company, optional: true
  has_and_belongs_to_many :categories
  has_one_attached :image

  enum status: {
    draft: 'draft',
    active: 'active',
    archived: 'archived',
    disabled: 'disabled'
  }, _suffix: true

  # Validations
  validates :name, :price, presence: true
  validates :status, inclusion: { in: statuses.keys }, allow_nil: true
  validate :blocked_transition_guard

  # Method to get image URL (prefers DB column, falls back to ActiveStorage)
  def image_url
    db_value = self[:image_url]
    return db_value if db_value.present?

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
  scope :visible, -> { active_status.where(featured: [true, nil]) }

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

  private

  # Impede retorno direto de disabled -> active para forçar ciclo de revisão
  def blocked_transition_guard
    return unless status_was.present? && status.present?
    if status_was == 'disabled' && status == 'active'
      errors.add(:status, 'não pode voltar de disabled direto para active (use draft -> active)')
    end
  end

end
