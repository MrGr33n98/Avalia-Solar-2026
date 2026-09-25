# frozen_string_literal: true

module Sales
  class EmailSequenceEnrollment < ApplicationRecord
    self.table_name = 'sales_email_sequence_enrollments'

    STATUSES = %w[active paused completed stopped failed].freeze

    belongs_to :company
    belongs_to :sequence, class_name: 'Sales::EmailSequence', foreign_key: :sales_email_sequence_id
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id, optional: true
    belongs_to :owner, class_name: 'User'
    has_many :steps, class_name: 'Sales::EmailSequenceEnrollmentStep',
                     foreign_key: :sales_email_sequence_enrollment_id, dependent: :destroy

    validates :status, inclusion: { in: STATUSES }
    validates :sales_contact_id, uniqueness: {
      scope: :sales_email_sequence_id,
      conditions: -> { where(status: %w[active paused]) }
    }

    scope :due, ->(at = Time.current) { where(status: 'active').where('next_action_at <= ?', at) }

    def pause!(reason: nil)
      return self unless status == 'active'

      update!(status: 'paused', paused_at: Time.current, stop_reason: reason)
    end

    def resume!
      return self unless status == 'paused'

      update!(status: 'active', paused_at: nil, stop_reason: nil, next_action_at: Time.current)
    end

    def stop!(reason:)
      return self if %w[stopped completed].include?(status)

      update!(status: 'stopped', stopped_at: Time.current, next_action_at: nil, stop_reason: reason)
    end
  end
end
