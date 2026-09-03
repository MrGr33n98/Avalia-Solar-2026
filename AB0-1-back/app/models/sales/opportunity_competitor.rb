# frozen_string_literal: true

module Sales
  class OpportunityCompetitor < ApplicationRecord
    self.table_name = 'sales_opportunity_competitors'

    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id
    belongs_to :competitor, class_name: 'Sales::Competitor', foreign_key: :sales_competitor_id
  end
end
