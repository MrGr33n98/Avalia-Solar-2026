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
  validate :valid_status_transition, if: :status_changed?

  scope :visible_to_company, ->(company_id) { where(company_id: company_id) }
  scope :actionable, -> { where(status: %w[sent viewed]) }

  def self.acceptance_sla_minutes
    Integer(ENV.fetch('LEAD_ACCEPTANCE_SLA_MINUTES', '120'), exception: false) || 120
  end

  def mark_viewed!
    return if viewed_at.present? || accepted_status? || rejected_status? || expired_status? || converted_status?

    update!(status: 'viewed', viewed_at: Time.current)
    
    # Track analytics event
    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: 'lead_distribution_viewed',
      metadata: { lead_id: lead_id, distribution_id: id }
    )
  end

  def accept!
    return if accepted_status? || converted_status?
    raise ActiveRecord::RecordInvalid, self unless sent_status? || viewed_status?

    update!(status: 'accepted', accepted_at: Time.current)

    # Track analytics event
    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: 'lead_distribution_accepted',
      metadata: { lead_id: lead_id, distribution_id: id }
    )
  end

  def reject!(reason, notes: nil)
    raise ArgumentError, 'invalid rejection reason' unless REJECTION_REASONS.include?(reason.to_s)

    update!(status: 'rejected', rejected_at: Time.current, rejection_reason: reason.to_s,
            payload: (payload || {}).merge('rejection_notes' => notes.to_s.truncate(500)).compact)

    # Track analytics events
    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: 'lead_distribution_rejected',
      metadata: { lead_id: lead_id, distribution_id: id, reason: reason }
    )

    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: 'lead_rerouted',
      metadata: { lead_id: lead_id, distribution_id: id }
    )

    # Rerouting trigger
    LeadRoutingJob.perform_later(lead_id)
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

  private

  def valid_status_transition
    old_status = status_was&.to_sym
    new_status = status&.to_sym
    return if old_status == new_status
    return if old_status.nil? # new record

    allowed = {
      queued: [:sent],
      sent: [:viewed, :accepted, :rejected, :expired],
      viewed: [:accepted, :rejected, :expired],
      accepted: [:converted],
      rejected: [],
      expired: [],
      converted: [],
      failed: []
    }

    allowed_targets = allowed[old_status] || []
    unless allowed_targets.include?(new_status)
      errors.add(:status, "Transição de status inválida: #{old_status} para #{new_status}")
    end
  end
end
