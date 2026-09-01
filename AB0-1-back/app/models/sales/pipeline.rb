module Sales
  class Pipeline < ApplicationRecord
    self.table_name = 'sales_pipelines'
    has_many :stages, class_name: 'Sales::Stage', foreign_key: :sales_pipeline_id, dependent: :destroy
    has_many :opportunities, class_name: 'Sales::Opportunity', foreign_key: :sales_pipeline_id, dependent: :restrict_with_error
    validates :name, :key, presence: true
    validates :key, uniqueness: true
  end
end
