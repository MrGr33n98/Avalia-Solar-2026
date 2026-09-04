module Sales
  class SavedView < ApplicationRecord
    self.table_name = 'sales_saved_views'

    belongs_to :user, optional: true
    belongs_to :company, optional: true

    RESOURCE_TYPES = %w[account contact opportunity].freeze

    validates :name, presence: true
    validates :resource_type, inclusion: { in: RESOURCE_TYPES }

    scope :for_user, ->(u_id) { where('user_id = ? OR is_shared = true', u_id) }
    scope :for_tenant_user, ->(user) {
      return all if user&.admin?
      return where(company_id: user.company_id).where('user_id = ? OR is_shared = true', user.id) if user&.company_id.present?

      where(user_id: user&.id)
    }
  end
end
