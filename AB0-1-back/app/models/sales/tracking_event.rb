module Sales
  class TrackingEvent < ApplicationRecord
    self.table_name = 'sales_tracking_events'

    belongs_to :company, optional: true
    belongs_to :account, class_name: 'Sales::Account', optional: true
    belongs_to :contact, class_name: 'Sales::Contact', optional: true
    belongs_to :session, class_name: 'Sales::TrackingSession', foreign_key: :session_id, primary_key: :session_id, optional: true

    delegate :outbound_click, to: :session, allow_nil: true

    validates :session_id, :event_name, :occurred_at, presence: true

    scope :by_company, ->(cid) { where(company_id: cid) }
    scope :recent, -> { order(occurred_at: :desc) }
  end
end
