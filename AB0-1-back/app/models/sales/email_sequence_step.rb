# frozen_string_literal: true

module Sales
  class EmailSequenceStep < ApplicationRecord
    self.table_name = 'sales_email_sequence_steps'

    belongs_to :email_sequence, class_name: 'Sales::EmailSequence'
    belongs_to :email_template, class_name: 'Sales::EmailTemplate', optional: true

    validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :delay_days, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  end
end
