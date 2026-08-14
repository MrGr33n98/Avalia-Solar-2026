class ReviewForm < ApplicationRecord
  FORM_TYPES = %w[
    general residential_solar commercial_solar rural_solar solar_maintenance
    battery_storage ev_charger electric_vehicle customer_service after_sales custom
  ].freeze

  DEFAULT_SETTINGS = {
    'criteria' => %w[Atendimento Qualidade Prazo Custo-benefício Recomendação],
    'comment_required' => true,
    'thank_you_message' => 'Obrigado! Sua avaliação foi enviada para moderação.',
    'whatsapp_message' => "Olá! Sua opinião é muito importante. Avalie sua experiência aqui:\n{{review_form_link}}"
  }.freeze

  belongs_to :company
  has_many :reviews, dependent: :nullify
  has_many :review_form_events, dependent: :destroy

  has_secure_token :token, length: 24

  enum status: { active: 'active', inactive: 'inactive' }, _default: 'active'

  before_validation :set_slug
  before_validation :normalize_settings

  validates :name, :public_title, :form_type, :slug, :status, presence: true
  validates :form_type, inclusion: { in: FORM_TYPES }
  validates :slug, uniqueness: { scope: :company_id }
  validates :token, uniqueness: true
  validates :public_title, length: { maximum: 120 }
  validates :public_description, length: { maximum: 500 }, allow_blank: true

  scope :recent_first, -> { order(created_at: :desc) }

  def self.ransackable_attributes(_auth_object = nil)
    %w[company_id created_at form_type id is_default name public_title slug status token updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company reviews]
  end

  def public_path
    "/f/#{token}"
  end

  def normalized_settings
    ReviewForms::SettingsNormalizer.call(settings)
  end

  def experience_category
    category_id = normalized_settings.dig('experience', 'category_id')
    category = company.categories.find_by(id: category_id) if category_id.present?
    return category if category

    Rails.logger.warn("[ReviewForms] legacy category fallback form=#{id} company=#{company_id}")
    company.categories.first
  end

  def metrics
    metrics = ReviewForms::MetricsService.call(review_form: self)
    metrics.slice(:views, :submissions, :conversion_rate).merge(metrics.slice(:starts, :approved, :rejected, :start_rate, :completion_rate, :approval_rate))
  end

  private

  def set_slug
    base = name.to_s.parameterize.presence || 'formulario'
    candidate = base
    suffix = 2
    while company&.review_forms&.where.not(id: id)&.exists?(slug: candidate)
      candidate = "#{base}-#{suffix}"
      suffix += 1
    end
    self.slug = candidate if slug.blank? || will_save_change_to_name?
  end

  def normalize_settings
    self.settings = ReviewForms::SettingsNormalizer.call(settings)
  end
end
