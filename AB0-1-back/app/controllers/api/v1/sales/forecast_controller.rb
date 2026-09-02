module Api
  module V1
    module Sales
      class ForecastController < BaseController
        def index
          opportunities = ::Sales::Opportunity.open.where(expected_close_date: Date.current..)
          buckets = opportunities.group_by { |item| item.expected_close_date.beginning_of_month }
          render json: { forecast: buckets.sort.map { |month, items| { month: month, pipeline_cents: items.sum(&:value_cents), weighted_cents: items.sum { |item| (item.value_cents.to_i * item.probability.to_f / 100).round } } } }
        end
      end
    end
  end
end
