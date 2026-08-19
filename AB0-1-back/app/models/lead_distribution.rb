class LeadDistribution < ApplicationRecord
  belongs_to :lead
  belongs_to :company

  enum status: {
    queued: 'queued',
    sent: 'sent',
    viewed: 'viewed',
    accepted: 'accepted',
    rejected: 'rejected',
    expired: 'expired',
    converted: 'converted',
    failed: 'failed'
  }, _suffix: true

  REJECTION_REASONS = %w[outside_area wrong_category no_capacity duplicate invalid_contact other].freeze
  validates :rejection_reason, inclusion: { in: REJECTION_REASONS }, allow_blank: true
  validates :match_score, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true

  scope :visible_to_company, ->(company_id) { where(company_id: company_id) }
  scope :actionable, -> { where(status: %w[sent viewed]) }

  def self.acceptance_sla_minutes
    Integer(ENV.fetch('LEAD_ACCEPTANCE_SLA_MINUTES', '120'), exception: false) || 120
  end

  def mark_viewed!
    return if viewed_at.present? || accepted? || rejected? || expired? || converted?

    update!(status: 'viewed', viewed_at: Time.current)
  end

  def accept!
    return if accepted? || converted?
    raise ActiveRecord::RecordInvalid, self unless sent? || viewed?

    update!(status: 'accepted', accepted_at: Time.current)
  end

  def reject!(reason, notes: nil)
    raise ArgumentError, 'invalid rejection reason' unless REJECTION_REASONS.include?(reason.to_s)

    update!(status: 'rejected', rejected_at: Time.current, rejection_reason: reason.to_s,
            payload: (payload || {}).merge('rejection_notes' => notes.to_s.truncate(500)).compact)
  end

  def convert!
    update!(status: 'converted', converted_at: Time.current)
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[assigned_at company_id created_at id lead_id status updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company lead]
  end
  def rule_explanation
    parts = []
    parts << "categoria=#{lead.category&.name || "todas"}"
    parts << "regiao=#{lead.state.presence || lead.city.presence || "todas"}"
    parts << "score=#{lead.try(:cached_score) || "não calculado"}"
    parts << "empresa=#{company&.name || "não definida"}"
    parts.join(" · ")
  end
end
