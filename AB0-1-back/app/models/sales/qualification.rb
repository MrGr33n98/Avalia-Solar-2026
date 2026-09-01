module Sales
  class Qualification < ApplicationRecord
    self.table_name = 'sales_qualifications'
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id
  end
end
