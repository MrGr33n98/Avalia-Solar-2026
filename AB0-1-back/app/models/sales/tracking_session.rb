module Sales
  class TrackingSession < ApplicationRecord
    self.table_name = 'sales_tracking_sessions'
    belongs_to :account, class_name: 'Sales::Account', optional: true
    belongs_to :contact, class_name: 'Sales::Contact', optional: true
    has_many :events, class_name: 'Sales::TrackingEvent', foreign_key: :session_id, primary_key: :session_id,
             dependent: :nullify
    validates :session_id, :started_at, presence: true
  end
end
