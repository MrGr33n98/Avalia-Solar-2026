module Sales
  class Stage < ApplicationRecord
    self.table_name = 'sales_stages'
    belongs_to :pipeline, class_name: 'Sales::Pipeline', foreign_key: :sales_pipeline_id
    has_many :opportunities, class_name: 'Sales::Opportunity', foreign_key: :sales_stage_id, dependent: :restrict_with_error
    validates :name, :key, :position, presence: true
    validates :key, uniqueness: { scope: :sales_pipeline_id }
    validates :position, uniqueness: { scope: :sales_pipeline_id }
  end
end
