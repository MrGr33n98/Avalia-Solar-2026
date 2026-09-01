module Sales
  class Task < ApplicationRecord
    self.table_name = 'sales_tasks'
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id, optional: true
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id, optional: true
    belongs_to :owner, class_name: 'User'
    validates :task_type, :title, :status, presence: true
    scope :pending, -> { where(status: 'pending') }
    scope :overdue, -> { pending.where('due_at < ?', Time.current) }
  end
end
