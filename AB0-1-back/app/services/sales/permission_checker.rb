module Sales
  class PermissionChecker
    def self.allowed?(user:, resource:, action:)
      user.admin? || UserRole.joins(role: :permissions).where(user: user, sales_permissions: { resource: resource, action: action }).exists?
    end
  end
end
