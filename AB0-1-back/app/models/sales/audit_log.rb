module Sales
  class AuditLog < ApplicationRecord
    self.table_name = 'sales_audit_logs'
    belongs_to :company, optional: true
    belongs_to :actor, class_name: 'User', optional: true
    validates :action, :auditable_type, :auditable_id, presence: true
  end
end
