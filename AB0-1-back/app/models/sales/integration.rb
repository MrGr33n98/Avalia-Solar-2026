module Sales
  class Integration < ApplicationRecord
    self.table_name = 'sales_integrations'
    belongs_to :company, optional: true
    belongs_to :created_by, class_name: 'User', optional: true
    validates :provider, :name, presence: true
  end
end
