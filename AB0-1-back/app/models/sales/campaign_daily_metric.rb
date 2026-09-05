# frozen_string_literal: true

module Sales
  class CampaignDailyMetric < ApplicationRecord
    self.table_name = 'sales_campaign_daily_metrics'

    belongs_to :company
    belongs_to :campaign, class_name: 'Sales::Campaign', foreign_key: :sales_campaign_id

    validates :metric_date, presence: true
    validates :metric_date, uniqueness: { scope: :sales_campaign_id }
  end
end
