module Sales
  class OpportunityLineItem < ApplicationRecord
    self.table_name = 'sales_opportunity_line_items'
    belongs_to :opportunity, class_name: 'Sales::Opportunity'
    belongs_to :product, class_name: 'Sales::Product'
    validates :quantity, :unit_price_cents, presence: true
  end
end
