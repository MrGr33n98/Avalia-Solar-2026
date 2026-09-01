module Sales
  class Activity < ApplicationRecord
    self.table_name = 'sales_activities'
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id, optional: true
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id, optional: true
    belongs_to :actor, class_name: 'User'
    validates :activity_type, :occurred_at, presence: true
  end
end
