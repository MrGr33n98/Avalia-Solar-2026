module Sales
  class Quote < ApplicationRecord
    self.table_name = 'sales_quotes'
    belongs_to :opportunity, class_name: 'Sales::Opportunity'
    belongs_to :solar_project, class_name: 'Sales::SolarProject', optional: true
    belongs_to :created_by, class_name: 'User', optional: true
    has_many :items, class_name: 'Sales::QuoteItem', dependent: :destroy
    has_many :events, class_name: 'Sales::QuoteEvent', dependent: :destroy
    validates :number, :status, presence: true
    validates :status, inclusion: { in: %w[draft sent accepted declined expired] }
  end
end
