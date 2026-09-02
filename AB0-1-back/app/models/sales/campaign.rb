module Sales
  class Campaign < ApplicationRecord
    self.table_name = 'sales_campaigns'
    belongs_to :company, optional: true
    validates :name, :campaign_key, presence: true
  end
end
