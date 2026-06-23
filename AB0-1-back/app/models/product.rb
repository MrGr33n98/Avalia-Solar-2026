# app/models/product.rb
class Product < ApplicationRecord
  include SeoStandardizable
  
  # Image upload limits based on plan
  ALLOWED_IMAGE_CONTENT_TYPES = %w[image/png image/jpeg image/jpg image/webp].freeze
  IMAGE_MAX_SIZE = 5.megabytes
  
  # Image limits by plan tier
  IMAGE_LIMITS = {
    'free' => 1,
    'pro' => 5,
    'enterprise' => 10
  }.freeze
  
  # Associations
  belongs_to :company, optional: true
  belongs_to :brand, optional: true
  has_and_belongs_to_many :categories
  has_many_attached :images
  has_many :product_specifications, dependent: :destroy
  has_many :spec_templates, through: :product_specifications
  has_many :product_price_histories, dependent: :destroy
  has_many :reviews, as: :reviewable, dependent: :destroy

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
  validate :validate_image_uploads

  # Method to get primary image URL from Active Storage
  def image_url
    return self[:image_url] unless images.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    Rails.application.routes.url_helpers.rails_storage_proxy_url(images.first, options)
  end

  # Returns all attached image URLs
  def image_urls
    return [image_url].compact unless images.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

    images.map do |img|
      Rails.application.routes.url_helpers.rails_storage_proxy_url(img, options)
    end
  end

  # Ransack configuration
  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id name description short_description price stock sku
      status featured seo_title seo_description brand_id
      company_id created_at updated_at
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company brand categories images_attachments images_blobs]
  end

  # Custom JSON
  scope :visible, -> { active_status.where(featured: [true, nil]) }

  def as_json(options = {})
    specs_payload = options[:include_specs] ? serialized_specs : nil
    brand_payload =
      if brand
        {
          id: brand.id,
          name: brand.name,
          slug: brand.slug
        }
      end

    super(options.merge(
      include: {
        categories: { only: %i[id name seo_url] },
        company: {
          only: %i[
            id name slug logo_url city state verified plan_status
            rating_avg reviews_count rating_count
          ]
        }
      },
      methods: %i[image_url image_urls],
      except: %i[created_at updated_at]
    )).merge(
      specs: specs_payload,
      brand: brand_payload,
      brand_id: brand&.id,
      brand_slug: brand&.slug
    ).compact
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
  rescue StandardError => e
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
  rescue StandardError => e
    Rails.logger.error("[PriceHistory] Failed to track price history for product #{id}: #{e.message}")
  end

  # Impede retorno direto de disabled -> active para forcar ciclo de revisao
  def blocked_transition_guard
    return unless status_was.present? && status.present?

    return unless status_was == 'disabled' && status == 'active'

    errors.add(:status, 'nao pode voltar de disabled direto para active (use draft -> active)')
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

    Category.where(id: ids_to_update).find_each(&:update_metrics!) if ids_to_update.present?
  rescue StandardError => e
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

  # Image upload validation based on plan limits
  def validate_image_uploads
    return unless images.attached?
    
    validate_upload_permission
    validate_image_count
    validate_image_types_and_sizes
  end

  def validate_upload_permission
    unless can_upload_images?
      errors.add(:images, upload_restriction_message)
    end
  end

  def validate_image_count
    max_images = max_images_allowed
    if images.count > max_images
      errors.add(:images, "você pode fazer upload de no máximo #{max_images} imagens no seu plano atual")
    end
  end

  def validate_image_types_and_sizes
    images.each do |image|
      validate_image_type(image)
      validate_image_size(image)
    end
  end

  def validate_image_type(image)
    return unless image.blob.present?
    
    unless ALLOWED_IMAGE_CONTENT_TYPES.include?(image.blob.content_type)
      errors.add(:images, "arquivo #{image.filename} deve ser JPG, PNG ou WEBP")
    end
  end

  def validate_image_size(image)
    return unless image.blob.present?
    
    if image.blob.byte_size > IMAGE_MAX_SIZE
      errors.add(:images, "arquivo #{image.filename} excede o limite de 5MB")
    end
  end

  public

  def max_images_allowed
    return IMAGE_LIMITS['free'] unless company&.plan

    # First check if plan has specific product_images_limit configuration
    plan_features = company.plan.feature_flags
    if plan_features['product_images_limit'].present?
      return plan_features['product_images_limit'].to_i
    end

    # Fallback to tier-based limits
    plan_tier = company.plan.inferred_plan_tier
    IMAGE_LIMITS[plan_tier] || IMAGE_LIMITS['free']
  end

  def remaining_image_slots
    [max_images_allowed - images.count, 0].max
  end

  def can_upload_images?
    return true unless company&.plan

    # Check if company has media_upload feature enabled
    plan_features = company.plan.feature_flags
    plan_features['media_upload'] == true
  end

  def can_upload_more_images?
    can_upload_images? && remaining_image_slots > 0
  end

  def upload_restriction_message
    return nil if can_upload_images?
    
    current_plan = company&.plan&.inferred_plan_tier || 'free'
    case current_plan
    when 'free'
      "O upload de imagens não está disponível no plano gratuito. Upgrade para o plano Pro para habilitar esta funcionalidade."
    else
      "O upload de imagens não está habilitado no seu plano atual."
    end
  end

  def plan_upgrade_message_for_images
    current_plan = company&.plan&.inferred_plan_tier || 'free'
    case current_plan
    when 'free'
      "Upgrade para o plano Pro para fazer upload de até 5 imagens por produto"
    when 'pro'
      "Upgrade para o plano Enterprise para fazer upload de até 10 imagens por produto"
    else
      nil
    end
  end
end
