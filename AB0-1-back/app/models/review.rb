class Review < ApplicationRecord
  include ReviewCallbacks

  belongs_to :company, counter_cache: true
  belongs_to :user
  belongs_to :category, optional: true
  has_many :review_decision_logs, dependent: :destroy
  has_many :review_criterion_scores, dependent: :destroy
  accepts_nested_attributes_for :review_criterion_scores, allow_destroy: true

  MAX_FEATURED_PER_COMPANY = 5

  enum status: { pending: 0, approved: 1, rejected: 2, in_analysis: 3 }
  enum project_type: { residential: 0, commercial: 1, industrial: 2, rural: 3 }
  enum installation_status: { completed: 0, in_progress: 1, waiting: 2 }

  # Columns: headline (string), pros (jsonb), cons (jsonb), buyer_tip (text), project_context (jsonb)
  # category_id (fk), is_legacy (boolean), granular_scores_snapshot (jsonb)

  store_accessor :metadata, :cta_clicks, :read_count, :last_aggregated_at, :backfill_method, :backfill_at

  # Scopes
  scope :approved_only, -> { where(status: statuses[:approved]) }
  scope :published, -> { approved_only }
  scope :featured_only, -> { where(featured: true) }
  scope :for_company, ->(company_id) { where(company_id: company_id) if company_id.present? }
  scope :for_category, ->(category_id) { where(category_id: category_id) if category_id.present? }
  scope :global, -> { where(category_id: nil) }
  scope :categorized, -> { where.not(category_id: nil) }
  scope :for_social_proof, -> { approved_only.featured_only.order(display_order: :asc, created_at: :desc) }

  # Callbacks
  before_save :persist_granular_scores_snapshot
  after_commit :track_analytics_event, on: :create
  after_commit :notify_slack, on: :create
  after_commit :invalidate_social_proof_cache
  after_commit :enqueue_aggregation, on: %i[create update], if: :should_recalculate_aggregates?
  after_update_commit :notify_user_of_reply, if: :saved_change_to_reply?

  # Validations
  validates :rating, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 }
  validates :comment, presence: true, length: { minimum: 10 }
  validates :category_id, presence: true, unless: :is_legacy?
  validates :headline, length: { maximum: 120 }, allow_blank: true
  
  validate :validate_uniqueness_v2
  validate :validate_featured_requires_paid_plan
  validate :validate_featured_limit_per_company
  validate :validate_featured_requires_approved_status

  def pros
    Array(super)
  end

  def cons
    Array(super)
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[comment created_at display_order featured id company_id category_id rating status updated_at user_id verified headline]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company user category]
  end

  def self.social_proof_cache_key(company_id, limit: nil)
    suffix = limit.present? ? "limit/#{limit}" : '*'
    "social_proof/company/#{company_id}/#{suffix}"
  end

  def self.invalidate_social_proof_cache_for_company(company_id)
    return if company_id.blank?

    Rails.cache.delete_matched(social_proof_cache_key(company_id))
  rescue StandardError => e
    Rails.logger.warn("[Review] failed to invalidate social proof cache for company=#{company_id}: #{e.message}")
  end

  def public_reviewer_name
    raw_name = user&.name.to_s.strip
    return 'Cliente' if raw_name.blank?
    return raw_name if user_consented_to_full_name?

    anonymize_name(raw_name)
  end

  private

  def persist_granular_scores_snapshot
    # Snapshot imutável para performance de leitura e histórico.
    # Persiste sempre que houver critérios associados (mesmo em rascunho/pendente)
    # para garantir que o front-end sempre tenha dados para renderizar.
    return if review_criterion_scores.empty? && granular_scores_snapshot.blank?

    # Se a review já tem critérios (via nested attributes ou DB), geramos o snapshot
    scores_to_snapshot = review_criterion_scores.any? ? review_criterion_scores : []
    
    return if scores_to_snapshot.empty?

    self.granular_scores_snapshot = scores_to_snapshot.map do |s|
      {
        title: s.title_snapshot || s.rating_criterion&.title,
        score: s.score.to_f,
        weight: s.weight_snapshot || s.rating_criterion&.weight
      }
    end
  end

  def invalidate_social_proof_cache
    ids = [company_id, company_id_before_last_save].compact.uniq
    ids.each { |id| self.class.invalidate_social_proof_cache_for_company(id) }
  end

  def should_recalculate_aggregates?
    approved? && (saved_change_to_status? || saved_change_to_rating? || previously_new_record?)
  end

  def enqueue_aggregation
    Reviews::AggregationJob.perform_later(id)
  rescue StandardError => e
    Rails.logger.error("[Review] Failed to enqueue aggregation for review=#{id}: #{e.message}")
  end

  def validate_uniqueness_v2
    return if company_id.blank? || user_id.blank? || user&.email.blank?

    # Regra Final: [user_id OR email, company_id, category_id]
    # Protege contra duplicidade mesmo se o usuário criar uma nova conta com o mesmo e-mail.
    existing = self.class.joins(:user)
                         .where(company_id: company_id, category_id: category_id)
                         .where("reviews.user_id = ? OR users.email = ?", user_id, user.email)
    
    existing = existing.where.not(id: id) if persisted?
    
    return unless existing.exists?

    category_name = category&.name || "esta categoria"
    msg = category_id.present? ? 
      "Você já avaliou esta empresa na categoria #{category_name}." : 
      "Você já possui uma avaliação global para esta empresa."
    
    errors.add(:base, "#{msg} Cada usuário (ou e-mail) pode enviar apenas uma avaliação por categoria.")
  end

  def validate_featured_requires_paid_plan
    return unless featured?
    return if company&.can_use_social_proof?

    errors.add(:featured, 'is only available for companies with eligible paid plans')
  end

  def validate_featured_limit_per_company
    return unless featured?
    return if company_id.blank?

    featured_count = self.class.where(company_id: company_id, featured: true).where.not(id: id).count
    return if featured_count < MAX_FEATURED_PER_COMPANY

    errors.add(:featured, "limit reached (max #{MAX_FEATURED_PER_COMPANY})")
  end

  def validate_featured_requires_approved_status
    return unless featured?
    return if approved?

    errors.add(:featured, 'requires approved status')
  end

  def user_consented_to_full_name?
    return false unless user

    consent_fields = %i[
      public_name_consent
      display_full_name_consent
      review_name_consent
      lgpd_name_consent
      show_full_name
    ]

    consent_fields.any? do |field|
      user.respond_to?(field) && ActiveModel::Type::Boolean.new.cast(user.public_send(field))
    end
  end

  def anonymize_name(value)
    parts = value.split(/\s+/).reject(&:blank?)
    return value if parts.empty?
    return "#{parts.first[0].upcase}." if parts.length == 1

    "#{parts.first} #{parts.last[0].upcase}."
  end

  def track_analytics_event
    # Enqueue async job instead of synchronous call
    Analytics::TrackEventJob.perform_later(
      company_id: company_id,
      event_type: 'review_created',
      metadata: {
        source: 'review',
        rating: rating.to_f
      },
      user_id: nil,
      tracked_at: created_at
    )
  rescue StandardError => e
    Rails.logger.warn("[Analytics] Failed to enqueue review tracking: #{e.message}")
  end

  def notify_slack
    SlackNotificationService.notify_review(self)
  end

  def notify_user_of_reply
    return if reply.blank?

    ReviewMailer.new_reply(self).deliver_later
  rescue StandardError => e
    Rails.logger.error("[ReviewMailer] Failed to enqueue reply email: #{e.message}")
  end
end
