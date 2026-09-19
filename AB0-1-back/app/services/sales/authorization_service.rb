# frozen_string_literal: true

module Sales
  class AuthorizationService
    class << self
      # Check if a user has surface-level access to the internal Sales domain
      # @param user [User]
      # @return [Boolean]
      def sales_access?(user:)
        return false unless user
        return true if user.admin?

        user.sales_roles.exists?
      end

      # Check if a user has a specific permission
      # @param user [User] The authenticated user
      # @param resource [String, Symbol] The sales resource (e.g., :opportunities, :accounts, :leads)
      # @param action [String, Symbol] The action (e.g., :read, :manage, :export)
      # @param permission [String] Optional dot-notation permission (e.g., "sales.opportunities.read")
      # @return [Boolean]
      def can?(user:, resource: nil, action: nil, permission: nil)
        return false unless user

        # Platform Admin explicit bypass
        return true if user.admin?

        # Parse dot-notation permission if provided
        if permission.present?
          parts = permission.to_s.split('.')
          if parts.size == 3 && parts[0] == 'sales'
            resource ||= parts[1]
            action ||= parts[2]
          else
            resource ||= parts[0]
            action ||= parts[1]
          end
        end

        return false if resource.blank? || action.blank?

        # Query user roles and associated permissions
        user.sales_roles
            .joins(:permissions)
            .where(sales_permissions: { resource: resource.to_s, action: action.to_s })
            .exists?
      end

      # Return array of permission strings for the user
      # @param user [User]
      # @return [Array<String>]
      def permissions_for(user:)
        return [] unless user
        return ['sales.*'] if user.admin?

        Sales::Permission
          .joins(role_permissions: { role: :user_roles })
          .where(sales_user_roles: { user_id: user.id })
          .distinct
          .pluck(:resource, :action)
          .map { |r, a| "sales.#{r}.#{a}" }
      end
    end
  end
end
