module Sales
  class ContactEmployment < ApplicationRecord
    self.table_name = 'sales_contact_employments'

    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id

    RELATIONSHIP_TYPES = %w[
      employee
      founder
      partner
      board_member
      advisor
      consultant
      former_employee
      other
    ].freeze

    validates :relationship_type, inclusion: { in: RELATIONSHIP_TYPES }
    validates :sales_contact_id, presence: true
    validates :sales_account_id, presence: true

    scope :current, -> { where(is_current: true) }
    scope :primary, -> { where(is_primary: true) }
  end
end
