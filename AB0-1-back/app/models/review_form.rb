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

  has_secure_token :token, length: 10

  enum status: { active: 'active', inactive: 'inactive' }, _default: 'active'

  before_validation :set_slug
  before_validation :normalize_settings

  validates :name, :public_title, :form_type, :slug, :token, :status, presence: true
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

  def metrics
    views = review_form_events.where(event_type: %w[form_viewed qr_scanned]).count
    submissions = reviews.count

    {
      views: views,
      submissions: submissions,
      conversion_rate: views.positive? ? ((submissions.to_f / views) * 100).round(1) : 0.0
    }
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
    self.settings = DEFAULT_SETTINGS.deep_merge((settings || {}).deep_stringify_keys)
  end
end
