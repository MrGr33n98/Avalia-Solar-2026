# frozen_string_literal: true

module Sales
  module Reporting
    class TopProductsQuery
      def self.call(opportunity_scope:)
        opp_ids = opportunity_scope.select(:id)
        line_items = ::Sales::OpportunityLineItem.where(opportunity_id: opp_ids)
        return [] if line_items.empty?

        products = ::Sales::Product.index_by(&:id)

        grouped = line_items.group(:product_id).pluck(
          :product_id,
          Arel.sql('COUNT(DISTINCT opportunity_id) AS deals_count'),
          Arel.sql('COALESCE(SUM(quantity), 0) AS total_qty'),
          Arel.sql('COALESCE(SUM(unit_price_cents * quantity), 0)::bigint AS total_revenue_cents')
        )

        grouped.map do |product_id, deals_count, total_qty, revenue_cents|
          product = products[product_id]
          {
            product_id: product_id,
            name: product&.name || "Produto ##{product_id}",
            category: product&.category || 'Geral',
            deals_count: deals_count,
            total_quantity: total_qty.to_f,
            total_revenue_cents: revenue_cents.to_i
          }
        end.sort_by { |item| -item[:total_revenue_cents] }
      end
    end
  end
end
