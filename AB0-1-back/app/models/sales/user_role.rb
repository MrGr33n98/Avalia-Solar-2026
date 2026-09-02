module Sales
  class UserRole < ApplicationRecord
    self.table_name = 'sales_user_roles'
    belongs_to :user
    belongs_to :role, class_name: 'Sales::Role'
  end
end
