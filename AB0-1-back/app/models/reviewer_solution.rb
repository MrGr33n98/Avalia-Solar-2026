class ReviewerSolution < ApplicationRecord
  belongs_to :user
  belongs_to :brand, optional: true
  belongs_to :product, optional: true
  has_many :events, class_name: 'ReviewerSolutionEvent', dependent: :restrict_with_exception

  STATUSES = %w[active rejected disabled].freeze
  TYPES = %w[company product service technology].freeze

  before_validation :sync_brand_from_product, if: -> { product_id.present? && brand_id.blank? }

  validates :name, :category, presence: true
  validates :solution_type, inclusion: { in: TYPES }
  validates :status, inclusion: { in: STATUSES }
  validates :name, uniqueness: { scope: :user_id }
  validates :usage_context, inclusion: { in: ReviewerBrandUsage::USAGE_CONTEXTS }, allow_nil: true
  validate :product_belongs_to_brand, if: -> { product_id.present? && brand_id.present? }

  after_commit :invalidate_creator_cache
  after_commit :enqueue_gamification_reevaluation, on: %i[create update destroy], if: -> { user_id.present? }

  def as_json(_options = {})
    json = {
      id: id.to_s,
      name: name,
      type: solution_type,
      category: category,
      verified: verified,
      status: status,
      companyId: company_id,
      brand_id: brand_id,
      product_id: product_id,
      usage_context: usage_context,
      created_at: created_at.iso8601
    }

    if brand
      json[:brand] = {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        initials: brand.initials,
        logo_url: brand.logo_url
      }
      json[:logo_url] ||= brand.logo_url
    end

    if product
      json[:product] = {
        id: product.id,
        name: product.name,
        sku: product.sku
      }
    end

    json
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[id user_id brand_id product_id name solution_type category usage_context verified status company_id created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[user brand product events]
  end

  private

  def sync_brand_from_product
    self.brand_id = product.brand_id if product&.brand_id.present?
  end

  def product_belongs_to_brand
    return unless product && brand_id

    if product.brand_id.present? && product.brand_id != brand_id
      errors.add(:product_id, 'não pertence à marca selecionada')
    end
  end

  def invalidate_creator_cache
    Creator::PublicProfileService.invalidate_for_user(user)
  end

  def enqueue_gamification_reevaluation
    Gamification::ReevaluateUserJob.perform_later(user_id, 'solution_changed')
  end
end
