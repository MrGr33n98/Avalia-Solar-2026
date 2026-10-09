class MarketplaceProposal < ApplicationRecord
  STATUSES = %w[draft sent viewed under_review negotiating meeting_scheduled accepted declined expired withdrawn
                not_selected closed_after_selection].freeze
  belongs_to :lead
  belongs_to :lead_distribution
  belongs_to :company
  belongs_to :buyer_user, class_name: 'User', optional: true
  belongs_to :created_by, class_name: 'User', optional: true
  has_many :versions, class_name: 'MarketplaceProposalVersion', foreign_key: :proposal_id, dependent: :destroy
  has_many :events, class_name: 'MarketplaceProposalEvent', foreign_key: :proposal_id, dependent: :destroy
  has_many :decisions, class_name: 'MarketplaceProposalDecision', foreign_key: :proposal_id, dependent: :destroy
  has_many :meetings, class_name: 'MarketplaceProposalMeeting', foreign_key: :proposal_id, dependent: :destroy
  has_one :project, class_name: 'MarketplaceProject', foreign_key: :proposal_id, dependent: :destroy
  has_many :conversations, dependent: :nullify

  validates :reference, presence: true, uniqueness: true
  validates :status, inclusion: { in: STATUSES }
  validates :lead_id, uniqueness: { scope: :company_id }

  def self.ransackable_attributes(_auth_object = nil)
    %w[accepted_at company_id created_at current_version_number declined_at expires_at id lead_distribution_id lead_id
       published_at reference status total_cents updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company lead lead_distribution buyer_user created_by versions events decisions meetings project]
  end

  def current_version
    versions.find_by(number: current_version_number) || versions.order(number: :desc).first
  end

  def publish!
    with_lock do
      raise ArgumentError, 'Somente rascunhos podem ser publicados' unless status == 'draft'

      version = current_version || versions.order(number: :desc).first
      raise ActiveRecord::RecordInvalid, self unless version

      version.publish!
      update!(status: 'sent', published_at: Time.current, total_cents: version.total_cents,
              current_version_number: version.number)
      lead.update!(wizard_status: 'proposal_sent') if lead.respond_to?(:wizard_status=)
      record_event('proposal.sent')
    end
  end

  def mark_viewed!(actor: nil)
    with_lock do
      return unless status == 'sent'

      update!(status: 'viewed', viewed_at: Time.current)
      record_event('proposal.viewed', actor: actor)
    end
  end

  def expired_for_decision?
    deadline = expires_at || current_version&.valid_until&.end_of_day
    deadline.present? && deadline <= Time.current
  end

  def request_change!(actor:, reason:)
    decisions.create!(buyer_user: actor, kind: 'request_change', reason: reason.to_s.truncate(1000))
    update!(status: 'negotiating')
    record_event('proposal.change_requested', actor: actor, metadata: { reason: reason.to_s.truncate(500) })
  end

  def record_event(event_type, actor: nil, metadata: {})
    events.create!(actor: actor, event_type: event_type, metadata: metadata, occurred_at: Time.current)
  end
end
