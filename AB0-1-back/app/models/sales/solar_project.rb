module Sales
  class SolarProject < ApplicationRecord
    self.table_name = 'sales_solar_projects'
    belongs_to :account, class_name: 'Sales::Account'
    belongs_to :opportunity, class_name: 'Sales::Opportunity', optional: true
    has_many :site_surveys, class_name: 'Sales::SolarSiteSurvey', dependent: :destroy
    validates :status, :version, presence: true
  end
end
