module Sales
  class Opportunity < ApplicationRecord
    self.table_name = 'sales_opportunities'
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id
    belongs_to :primary_contact, class_name: 'Sales::Contact', optional: true
    belongs_to :pipeline, class_name: 'Sales::Pipeline', foreign_key: :sales_pipeline_id
    belongs_to :stage, class_name: 'Sales::Stage', foreign_key: :sales_stage_id
    belongs_to :owner, class_name: 'User'
    has_many :stage_histories, class_name: 'Sales::StageHistory', foreign_key: :sales_opportunity_id, dependent: :destroy
    has_many :activities, class_name: 'Sales::Activity', foreign_key: :sales_opportunity_id, dependent: :destroy
    has_many :tasks, class_name: 'Sales::Task', foreign_key: :sales_opportunity_id, dependent: :destroy
    has_one :qualification, class_name: 'Sales::Qualification', foreign_key: :sales_opportunity_id, dependent: :destroy
    validates :name, :status, presence: true
    scope :open, -> { where(status: 'open') }
  end
end
