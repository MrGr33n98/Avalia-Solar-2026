module Sales
  class QuoteEvent < ApplicationRecord
    self.table_name = 'sales_quote_events'
    belongs_to :quote, class_name: 'Sales::Quote'
    belongs_to :actor, class_name: 'User', optional: true
    validates :event_type, presence: true
  end
end
