# frozen_string_literal: true

module Sales
  class EmailSequence < ApplicationRecord
    self.table_name = 'sales_email_sequences'

    belongs_to :company
    belongs_to :user, optional: true
    has_many :steps, class_name: 'Sales::EmailSequenceStep', dependent: :destroy
    accepts_nested_attributes_for :steps, allow_destroy: true

    validates :name, presence: true
    scope :active, -> { where(active: true) }
  end
end
