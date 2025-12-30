# frozen_string_literal: true

class CompanyDailyStat < ApplicationRecord
  belongs_to :company

  validates :company_id, presence: true
  validates :day, presence: true

  scope :for_company, ->(company_id) { where(company_id: company_id) }
  scope :for_days, ->(from_day, to_day) { where(day: from_day..to_day) }
end
