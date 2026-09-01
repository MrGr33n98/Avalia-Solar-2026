module Sales
  class Account < ApplicationRecord
    self.table_name = 'sales_accounts'
    belongs_to :company, optional: true
    belongs_to :owner, class_name: 'User'
    has_many :contacts, class_name: 'Sales::Contact', foreign_key: :sales_account_id, dependent: :destroy
    has_many :opportunities, class_name: 'Sales::Opportunity', foreign_key: :sales_account_id, dependent: :destroy
    has_many :activities, class_name: 'Sales::Activity', foreign_key: :sales_account_id, dependent: :destroy
    has_many :tasks, class_name: 'Sales::Task', foreign_key: :sales_account_id, dependent: :destroy
    validates :name, presence: true
  end
end
