class SubscriptionPlan < ApplicationRecord
  belongs_to :category
  belongs_to :plan
  belongs_to :product
  belongs_to :member, class_name: 'User', foreign_key: :member_id, optional: true

  STATUS_VALUES = %w[
    draft
    trial
    active
    paused
    canceled
    expired
    inactive
  ].freeze

  STATUS_ALIASES = {
    'rascunho' => 'draft',
    'draft' => 'draft',
    'teste' => 'trial',
    'trial' => 'trial',
    'ativo' => 'active',
    'active' => 'active',
    'pausado' => 'paused',
    'paused' => 'paused',
    'cancelado' => 'canceled',
    'cancelled' => 'canceled',
    'canceled' => 'canceled',
    'expirado' => 'expired',
    'vencido' => 'expired',
    'expired' => 'expired',
    'inativo' => 'inactive',
    'inactive' => 'inactive'
  }.freeze

  STATUS_LABELS = {
    'draft' => 'Rascunho',
    'trial' => 'Trial',
    'active' => 'Ativo',
    'paused' => 'Pausado',
    'canceled' => 'Cancelado',
    'expired' => 'Expirado',
    'inactive' => 'Inativo'
  }.freeze

  before_validation :normalize_status
  before_validation :auto_expire_when_ended

  validates :category, :plan, :product, presence: true
  validates :value, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :status, inclusion: { in: STATUS_VALUES }, allow_blank: true
  validate :validate_period_order
  validate :validate_purchase_before_end

  scope :with_status, ->(status) { where(status: normalize_status_value(status)) }
  scope :active_status, -> { where(status: 'active') }
  scope :trial_status, -> { where(status: 'trial') }
  scope :active_or_trial, -> { where(status: %w[active trial]) }
  scope :currently_active, lambda {
    now = Time.current
    active_or_trial
      .where('start_at IS NULL OR start_at <= ?', now)
      .where('end_at IS NULL OR end_at >= ?', now)
  }
  scope :expired_records, lambda {
    now = Time.current
    where(status: 'expired').or(where('end_at < ?', now))
  }
  scope :ending_within, lambda { |days = 30|
    now = Time.current
    where(status: %w[active trial]).where(end_at: now..(now + days.to_i.days))
  }
  scope :recent_first, -> { order(start_at: :desc, created_at: :desc) }

  delegate :company, to: :product, allow_nil: true

  def self.status_collection
    STATUS_VALUES.map { |status| [status_label(status), status] }
  end

  def self.status_label(value)
    STATUS_LABELS[value.to_s] || value.to_s.humanize
  end

  def self.normalize_status_value(value)
    return nil if value.blank?

    STATUS_ALIASES[value.to_s.strip.downcase]
  end

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id
      member_id
      product_id
      category_id
      plan_id
      value
      status
      purchased_at
      start_at
      end_at
      created_at
      updated_at
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[category member plan product]
  end

  def member_display_name
    return "Sem cliente (##{member_id})" if member.nil? && member_id.present?
    return 'Sem cliente' if member.nil?

    member.name.presence || member.email || "Usuario ##{member.id}"
  end

  def status_label
    self.class.status_label(status)
  end

  def effective_value
    value.presence || plan&.price
  end

  def active_on?(time = Time.current)
    return false unless status.in?(%w[active trial])
    return false if start_at.present? && start_at > time
    return false if end_at.present? && end_at < time

    true
  end

  def expired?
    status == 'expired' || (end_at.present? && end_at < Time.current)
  end

  private

  def normalize_status
    normalized = self.class.normalize_status_value(status)
    self.status = normalized if normalized.present?
  end

  def auto_expire_when_ended
    return if end_at.blank?
    return unless end_at < Time.current
    return unless status.blank? || status.in?(%w[active trial])

    self.status = 'expired'
  end

  def validate_period_order
    return if start_at.blank? || end_at.blank?
    return if end_at >= start_at

    errors.add(:end_at, 'deve ser maior ou igual a data de inicio')
  end

  def validate_purchase_before_end
    return if purchased_at.blank? || end_at.blank?
    return if purchased_at <= end_at

    errors.add(:purchased_at, 'nao pode ser maior que a data de encerramento')
  end
end
