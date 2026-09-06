# frozen_string_literal: true

module Sales
  class ContactList < ApplicationRecord
    self.table_name = 'sales_contact_lists'

    belongs_to :company, class_name: '::Company'
    belongs_to :created_by, class_name: '::User', optional: true

    has_many :memberships, class_name: 'Sales::ContactListMembership', foreign_key: :sales_contact_list_id, dependent: :destroy
    has_many :contacts, through: :memberships, source: :contact

    validates :name, presence: true
    validates :kind, presence: true, inclusion: { in: %w[static imported] }

    scope :for_company, ->(company_id) { where(company_id: company_id) }
    scope :active, -> { where(active: true) }
  end
end
