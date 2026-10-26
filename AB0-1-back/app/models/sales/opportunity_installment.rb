# frozen_string_literal: true

module Sales
  class OpportunityInstallment < ApplicationRecord
    self.table_name = 'sales_opportunity_installments'

    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id

    STATUSES = %w[planned collected overdue cancelled].freeze

    validates :installment_number, numericality: { greater_than: 0 }
    validates :amount_cents, numericality: { greater_than_or_equal_to: 0 }
    validates :due_date, presence: true
    validates :status, inclusion: { in: STATUSES }

    scope :planned, -> { where(status: 'planned') }
    scope :collected, -> { where(status: 'collected') }
    scope :overdue, -> { where(status: 'overdue').or(planned.where('due_date < ?', Date.current)) }
  end
end
