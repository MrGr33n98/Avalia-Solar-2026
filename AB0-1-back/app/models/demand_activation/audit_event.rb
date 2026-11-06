# frozen_string_literal: true

module DemandActivation
  # Deliberately metadata-only: never persist contact identifiers in audit logs.
  class AuditEvent < ApplicationRecord
    self.table_name = 'demand_activation_audit_events'

    ACTIONS = %w[source_registered audience_created audience_updated audience_archived].freeze
    SUBJECT_TYPES = %w[Source AudienceSegment].freeze

    belongs_to :company
    belongs_to :actor, class_name: 'User'

    validates :action, inclusion: { in: ACTIONS }
    validates :subject_type, inclusion: { in: SUBJECT_TYPES }
    validates :subject_id, presence: true
  end
end
