module Sales
  class Contact < ApplicationRecord
    self.table_name = 'sales_contacts'
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id
    alias_attribute :account_id, :sales_account_id
    belongs_to :user, optional: true
    has_many :opportunities, class_name: 'Sales::Opportunity', foreign_key: :primary_contact_id, dependent: :nullify
    validates :first_name, presence: true
  end
end
