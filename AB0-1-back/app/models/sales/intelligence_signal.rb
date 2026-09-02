module Sales
  class IntelligenceSignal < ApplicationRecord
    self.table_name = 'sales_intelligence_signals'

    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id, optional: true
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id, optional: true
    belongs_to :acknowledged_by, class_name: 'User', optional: true

    SIGNAL_TYPES = %w[
      profile_unclaimed
      profile_incomplete
      high_rating
      many_reviews
      verified_profile
      catalog_incomplete
      no_products
      decision_maker_found
      no_decision_maker
      missing_next_action
      stale_opportunity
      high_data_quality
      low_data_quality
    ].freeze

    SEVERITIES = %w[info warning hot critical].freeze

    validates :signal_type, inclusion: { in: SIGNAL_TYPES }
    validates :severity, inclusion: { in: SEVERITIES }
    validates :title, presence: true
    validates :detected_at, presence: true

    scope :active, -> { where(acknowledged_at: nil).where('expires_at IS NULL OR expires_at > ?', Time.current) }
    scope :acknowledged, -> { where.not(acknowledged_at: nil) }

    def acknowledge!(user)
      update!(acknowledged_at: Time.current, acknowledged_by: user)
    end
  end
end
