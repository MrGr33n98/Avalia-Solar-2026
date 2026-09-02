module Sales
  class Role < ApplicationRecord
    self.table_name = 'sales_roles'
    belongs_to :company, optional: true
    has_many :role_permissions, class_name: 'Sales::RolePermission', dependent: :destroy
    has_many :permissions, through: :role_permissions
    has_many :user_roles, class_name: 'Sales::UserRole', dependent: :destroy
    validates :name, :slug, presence: true
  end
end
