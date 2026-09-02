module Sales
  class Permission < ApplicationRecord
    self.table_name = 'sales_permissions'
    has_many :role_permissions, class_name: 'Sales::RolePermission', dependent: :destroy
    validates :resource, :action, presence: true
  end
end
