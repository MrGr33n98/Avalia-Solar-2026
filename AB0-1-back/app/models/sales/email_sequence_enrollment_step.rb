# frozen_string_literal: true

module Sales
  class EmailSequenceEnrollmentStep < ApplicationRecord
    self.table_name = 'sales_email_sequence_enrollment_steps'

    STATUSES = %w[queued task_pending completed failed].freeze

    belongs_to :company
    belongs_to :enrollment, class_name: 'Sales::EmailSequenceEnrollment',
                            foreign_key: :sales_email_sequence_enrollment_id, inverse_of: :steps
    belongs_to :sequence_step, class_name: 'Sales::EmailSequenceStep',
                               foreign_key: :sales_email_sequence_step_id
    has_one :email_message, class_name: 'Sales::EmailMessage',
                            foreign_key: :sales_email_sequence_enrollment_step_id, dependent: :nullify
    has_one :task, class_name: 'Sales::Task',
                   foreign_key: :sales_email_sequence_enrollment_step_id, dependent: :nullify

    validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :status, inclusion: { in: STATUSES }
  end
end
