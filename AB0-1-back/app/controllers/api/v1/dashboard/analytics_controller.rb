module Api
  module V1
    module Dashboard
      class AnalyticsController < BaseController
        def index
          return unless authorize_feature!('analytics')

          leads = current_company.leads
          content = Article.joins(:companies).where(companies: { id: current_company.id })
          campaigns = CampaignReview.where(company_id: current_company.id)

          render json: {
            leads_by_budget: leads.where.not(estimated_budget: [nil, '']).group(:estimated_budget).count,
            content_performance: content.order(views_count: :desc).limit(5).map do |article|
              {
                id: article.id,
                title: article.title,
                views_count: article.views_count.to_i
              }
            end,
            campaigns: campaigns.order(created_at: :desc).map do |campaign|
              {
                id: campaign.id,
                title: campaign.title,
                goal: campaign.goal.to_i,
                achieved: campaign.achieved.to_i
              }
            end
          }
        end
      end
    end
  end
end
