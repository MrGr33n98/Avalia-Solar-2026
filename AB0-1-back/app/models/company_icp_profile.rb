# frozen_string_literal: true

class CompanyIcpProfile < ApplicationRecord
  belongs_to :company

  STRICTNESS_LEVELS = %w[flexible balanced strict].freeze
  TARGET_AUDIENCES = %w[PF PJ Rural Usinas Frotas].freeze
  ROOF_TYPES = %w[colonial metalico laje fibrocimento solo carport].freeze
  EV_CHARGER_TYPES = %w[ac_wallbox dc_fast_charger hub_fleet].freeze

  validates :strictness_level, inclusion: { in: STRICTNESS_LEVELS }
  validates :min_monthly_bill, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :min_system_kwp, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id company_id min_monthly_bill max_monthly_bill min_system_kwp
      strictness_level auto_reject_out_of_icp notify_only_high_match
      nationwide created_at updated_at
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company]
  end

  def target_cities_list
    Array(target_cities)
  end

  def target_states_list
    Array(target_states)
  end
end
