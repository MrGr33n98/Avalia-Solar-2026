module Sales
  class StageHistory < ApplicationRecord
    self.table_name = 'sales_stage_histories'
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id
    belongs_to :from_stage, class_name: 'Sales::Stage', optional: true
    belongs_to :to_stage, class_name: 'Sales::Stage'
    belongs_to :actor, class_name: 'User', optional: true
  end
end
