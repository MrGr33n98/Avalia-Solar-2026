module Sales
  class Note < ApplicationRecord
    self.table_name = 'sales_notes'
    belongs_to :company, optional: true
    belongs_to :account, class_name: 'Sales::Account', optional: true, foreign_key: :account_id
    belongs_to :opportunity, class_name: 'Sales::Opportunity', optional: true, foreign_key: :opportunity_id
    belongs_to :contact, class_name: 'Sales::Contact', optional: true, foreign_key: :contact_id
    belongs_to :author, class_name: 'User'
    validates :body, presence: true
  end
end
