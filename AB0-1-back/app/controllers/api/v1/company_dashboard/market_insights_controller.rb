# app/controllers/api/v1/company_dashboard/market_insights_controller.rb
module Api
  module V1
    module CompanyDashboard
      class MarketInsightsController < CompanyDashboardController
        def index
          authorize @company, :view_leads?
          category = @company.categories.first
          market_leads = market_leads_for(category&.id)
          my_lead_ids = lead_ids_for_company
          enabled = leads_enabled?

          render json: market_payload(category, market_leads, my_lead_ids, enabled)
        end

        private

        def leads_enabled?
          EntitlementService.entitled?(company: @company, feature: :leads_marketplace)
        end

        def market_leads_for(category_id)
          return Lead.none if category_id.blank?

          Lead.where(created_at: 30.days.ago..Time.current, category_id: category_id)
        end

        def lead_ids_for_company
          distributed_ids = @company.lead_distributions.select(:lead_id)
          Lead.where(company_id: @company.id).or(Lead.where(id: distributed_ids)).select(:id)
        end

        def market_payload(category, market_leads, my_lead_ids, enabled)
          total = market_leads.count
          mine = market_leads.where(id: my_lead_ids).count

          {
            category_name: category&.name || 'Sua Categoria',
            stats: market_stats(total, mine),
            opportunities: enabled ? opportunity_payload(market_leads, my_lead_ids) : [],
            is_premium: enabled
          }
        end

        def market_stats(total, mine)
          {
            total_market_leads: total,
            my_leads_count: mine,
            opportunities_count: total - mine,
            market_share_percent: total.positive? ? ((mine.to_f / total) * 100).round(1) : 0
          }
        end

        def opportunity_payload(market_leads, my_lead_ids)
          market_leads.where.not(id: my_lead_ids).order(created_at: :desc).limit(10).map do |lead|
            { id: lead.id, city: lead.city || 'Local não identificado', state: lead.state,
              product_vertical: lead.product_vertical, created_at: lead.created_at }
          end
        end
      end
    end
  end
end
