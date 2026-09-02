module Sales
  class QuoteItem < ApplicationRecord
    self.table_name = 'sales_quote_items'
    belongs_to :quote, class_name: 'Sales::Quote'
    belongs_to :product, class_name: 'Sales::Product', optional: true
    validates :description, :quantity, :unit_price_cents, :total_cents, presence: true
  end
end
