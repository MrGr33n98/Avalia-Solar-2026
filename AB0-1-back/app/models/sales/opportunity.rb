# frozen_string_literal: true

module Sales
  class Opportunity < ApplicationRecord
    self.table_name = 'sales_opportunities'

    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id
    belongs_to :primary_contact, class_name: 'Sales::Contact', optional: true
    belongs_to :pipeline, class_name: 'Sales::Pipeline', foreign_key: :sales_pipeline_id
    belongs_to :stage, class_name: 'Sales::Stage', foreign_key: :sales_stage_id
    belongs_to :owner, class_name: 'User'
    belongs_to :source, class_name: 'Sales::Source', foreign_key: :source_id, optional: true

    has_many :taggings, as: :taggable, class_name: 'Sales::Tagging', dependent: :destroy
    has_many :tags, through: :taggings, source: :tag
    has_many :stage_histories, class_name: 'Sales::StageHistory', foreign_key: :sales_opportunity_id, dependent: :destroy
    has_many :activities, class_name: 'Sales::Activity', foreign_key: :sales_opportunity_id, dependent: :destroy
    has_many :tasks, class_name: 'Sales::Task', foreign_key: :sales_opportunity_id, dependent: :destroy
    has_one :qualification, class_name: 'Sales::Qualification', foreign_key: :sales_opportunity_id, dependent: :destroy

    has_many :opportunity_contacts, class_name: 'Sales::OpportunityContact', foreign_key: :sales_opportunity_id, dependent: :destroy
    has_many :committee_contacts, through: :opportunity_contacts, source: :contact

    has_many :opportunity_competitors, class_name: 'Sales::OpportunityCompetitor', foreign_key: :sales_opportunity_id, dependent: :destroy
    has_many :competitors, through: :opportunity_competitors, source: :competitor

    TEMPERATURES = %w[cold warm hot].freeze

    validates :name, :status, presence: true
    validates :temperature, inclusion: { in: TEMPERATURES }

    scope :open, -> { where(status: 'open') }
    scope :hot, -> { where(temperature: 'hot') }

    def committee_coverage_score
      roles = opportunity_contacts.pluck(:role)
      required = %w[decision_maker economic_buyer champion approver]
      matched = (required & roles).size
      ((matched.to_f / required.size) * 100).round
    end
  end
end
