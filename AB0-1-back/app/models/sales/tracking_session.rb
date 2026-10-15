module Sales
  class TrackingSession < ApplicationRecord
    self.table_name = 'sales_tracking_sessions'

    ALLOWED_CONSENT_STATES = %w[granted denied unknown].freeze

    belongs_to :company, optional: true
    belongs_to :account, class_name: 'Sales::Account', optional: true
    belongs_to :contact, class_name: 'Sales::Contact', optional: true
    belongs_to :outbound_click, class_name: 'OutboundClick', optional: true

    has_many :events, class_name: 'Sales::TrackingEvent', foreign_key: :session_id, primary_key: :session_id,
             dependent: :nullify

    validates :session_id, :started_at, presence: true
    validates :consent_state, inclusion: { in: ALLOWED_CONSENT_STATES }, allow_nil: true

    scope :with_outbound_click, -> { where.not(outbound_click_id: nil) }
    scope :by_company, ->(cid) { where(company_id: cid) }
    scope :by_consent, ->(state) { where(consent_state: state) }
    scope :recent, -> { order(started_at: :desc) }

    def consent_granted?
      consent_state == 'granted'
    end

    def consent_denied?
      consent_state == 'denied'
    end

    def attributed?
      outbound_click_id.present?
    end
  end
end
