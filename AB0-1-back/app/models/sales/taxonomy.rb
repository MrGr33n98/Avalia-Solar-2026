module Sales
  class Taxonomy < ApplicationRecord
    self.table_name = 'sales_taxonomies'
    belongs_to :company, optional: true
    validates :kind, :name, :slug, presence: true
    scope :active, -> { where(active: true) }
  end
end
