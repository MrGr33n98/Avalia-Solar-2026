module Sales
  class RolePermission < ApplicationRecord
    self.table_name = 'sales_role_permissions'
    belongs_to :role, class_name: 'Sales::Role'
    belongs_to :permission, class_name: 'Sales::Permission'
  end
end
