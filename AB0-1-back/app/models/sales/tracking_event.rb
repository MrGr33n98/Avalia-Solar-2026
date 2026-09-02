module Sales
  class TrackingEvent < ApplicationRecord
    self.table_name = 'sales_tracking_events'
    belongs_to :account, class_name: 'Sales::Account', optional: true
    belongs_to :contact, class_name: 'Sales::Contact', optional: true
    validates :session_id, :event_name, :occurred_at, presence: true
  end
end
