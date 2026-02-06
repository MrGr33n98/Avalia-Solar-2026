# app/models/product.rb
class Product < ApplicationRecord
  # Associations
  belongs_to :company, optional: true
  has_and_belongs_to_many :categories
  has_one_attached :image
  has_many :product_specifications, dependent: :destroy
  has_many :spec_templates, through: :product_specifications
  has_many :product_price_histories, dependent: :destroy

  attr_accessor :category_ids_for_metrics_update
  before_save :capture_category_ids_for_metrics, prepend: true
  after_save :update_associated_categories_metrics
  after_save :track_price_history
  # after_commit :update_associated_categories_metrics, on: [:create, :update, :destroy]

  enum status: {
    draft: 'draft',
    active: 'active',
    archived: 'archived',
    disabled: 'disabled'
  }, _suffix: true

  # Validations
  validates :name, :price, :sku, presence: true
  validates :status, inclusion: { in: statuses.keys }, allow_nil: true
  validates :sku, uniqueness: true
  validate :blocked_transition_guard

  # Method to get image URL (prefers DB column, falls back to ActiveStorage)
  def image_url
    db_value = self[:image_url]
    return db_value if db_value.present?

    return nil unless image.attached?
    
    options = Rails.application.routes.default_url_options.dup
    if Rails.env.development? && options[:host] == 'localhost'
      options[:port] = 3001
    end
    
    Rails.application.routes.url_helpers.rails_storage_proxy_url(image, options)
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
    specs_payload = options[:include_specs] ? serialized_specs : nil

    super(options.merge(
      include: {
        categories: { only: %i[id name] },
        company: { only: %i[id name] }
      },
      methods: [:image_url],
      except: %i[created_at updated_at]
    )).merge(specs: specs_payload).compact
  end

  after_create :track_creation_event

  private

  def track_creation_event
    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: 'product_created',
      metadata: {
        product_id: id,
        name: name,
        price: price,
        status: status
      }
    )
  rescue => e
    Rails.logger.error("[Analytics] Failed to track product creation: #{e.message}")
  end

  def track_price_history
    return unless saved_change_to_price?
    return unless ProductPriceHistory.table_exists?

    product_price_histories.create!(
      price: price,
      recorded_at: Time.current,
      metadata: { source: 'model_callback' }
    )
  rescue => e
    Rails.logger.error("[PriceHistory] Failed to track price history for product #{id}: #{e.message}")
  end

  # Impede retorno direto de disabled -> active para forcar ciclo de revisao
  def blocked_transition_guard
    return unless status_was.present? && status.present?
    if status_was == 'disabled' && status == 'active'
      errors.add(:status, 'nao pode voltar de disabled direto para active (use draft -> active)')
    end
  end

  def capture_category_ids_for_metrics
    self.category_ids_for_metrics_update = categories.pluck(:id)
  end

  def update_associated_categories_metrics
    ids_to_update = category_ids_for_metrics_update

    if ids_to_update.blank?
      categories.reload
      ids_to_update = categories.pluck(:id)
    end

    if ids_to_update.present?
      Category.where(id: ids_to_update).find_each do |cat|
        cat.update_metrics!
      end
    end
  rescue => e
    Rails.logger.error("Failed to update categories metrics for product #{id}: #{e.message}")
  end

  def serialized_specs
    product_specifications.includes(:spec_template).map do |spec|
      tmpl = spec.spec_template
      {
        key: tmpl.key,
        label: tmpl.label,
        type: tmpl.value_type,
        unit: tmpl.unit,
        filterable: tmpl.filterable,
        sortable: tmpl.sortable,
        comparable: tmpl.comparable,
        seo_weight: tmpl.seo_weight,
        value: spec.value
      }
    end
  end

  def spec_value_for(template_key)
    product_specifications.joins(:spec_template).find_by(spec_templates: { key: template_key })&.value
  end
end
