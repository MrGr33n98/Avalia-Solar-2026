# frozen_string_literal: true

module Sales
  class SolarSiteSurvey < ApplicationRecord
    self.table_name = 'sales_solar_site_surveys'
    belongs_to :solar_project, class_name: 'Sales::SolarProject'
    belongs_to :inspector, class_name: 'User', optional: true

    STATUSES = %w[draft scheduled completed cancelled].freeze
    validates :status, inclusion: { in: STATUSES }
  end
end
