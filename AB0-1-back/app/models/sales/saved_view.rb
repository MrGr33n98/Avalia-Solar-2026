module Sales
  class SavedView < ApplicationRecord
    self.table_name = 'sales_saved_views'

    belongs_to :user, optional: true

    RESOURCE_TYPES = %w[account contact opportunity].freeze

    validates :name, presence: true
    validates :resource_type, inclusion: { in: RESOURCE_TYPES }

    scope :for_user, ->(u_id) { where('user_id = ? OR is_shared = true', u_id) }
  end
end
