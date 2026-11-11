module Sales
  class Stage < ApplicationRecord
    self.table_name = 'sales_stages'
    belongs_to :pipeline, class_name: 'Sales::Pipeline', foreign_key: :sales_pipeline_id
    belongs_to :sales_pipeline, class_name: 'Sales::Pipeline', foreign_key: :sales_pipeline_id, optional: true
    has_many :opportunities, class_name: 'Sales::Opportunity', foreign_key: :sales_stage_id, dependent: :restrict_with_error

    before_validation :generate_key, if: -> { key.blank? }

    validates :name, :key, :position, presence: true
    validates :key, uniqueness: { scope: :sales_pipeline_id }
    validates :position, uniqueness: { scope: :sales_pipeline_id }

    private

    def generate_key
      self.key = name.to_s.parameterize.underscore.presence if name.present?
    end
  end
end
