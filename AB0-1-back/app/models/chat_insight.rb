# frozen_string_literal: true

class ChatInsight < ApplicationRecord
  INSIGHT_TYPES = %w[
    frequent_question sales_objection market_demand city_demand
    category_interest competitor_mention pricing_objection
    financing_interest ev_condominium_demand solar_maintenance_demand
  ].freeze

  validates :insight_type, presence: true, inclusion: { in: INSIGHT_TYPES }
  validates :title, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(t) { where(insight_type: t) if t.present? }
  scope :by_vertical, ->(v) { where(vertical: v) if v.present? }
  scope :by_city, ->(c) { where(city: c) if c.present? }
  scope :high_confidence, -> { where('confidence_score >= ?', 0.7) }

  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id insight_type vertical city state title volume
      confidence_score source_period_start source_period_end created_at
    ]
  end
end
