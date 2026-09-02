module Sales
  class Product < ApplicationRecord
    self.table_name = 'sales_products'
    belongs_to :company, optional: true
    has_many :line_items, class_name: 'Sales::OpportunityLineItem', dependent: :restrict_with_exception
    validates :sku, :name, presence: true
  end
end
