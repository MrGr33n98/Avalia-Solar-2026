module Dashboard
  class AnalyticsController < BaseController
    def index
      company = current_user.company
      leads = company.leads
      campaigns = CampaignReview.where(company_id: company.id)

      @leads_total = leads.count
      @leads_by_budget = leads.where.not(estimated_budget: [nil, '']).group(:estimated_budget).count
      @leads_by_project_type = leads.where.not(project_type: [nil, '']).group(:project_type).count

      @top_articles = Article.joins(:companies).where(companies: { id: company.id }).order(views_count: :desc).limit(5)
      @shares_total = campaigns.sum(:shares)

      @campaign_goal_vs_achieved = [
        {
          name: 'Meta',
          data: campaigns.index_by { |c| c.title.presence || "Campanha ##{c.id}" }
                .transform_values { |c| c.goal.to_i }
        },
        {
          name: 'Atingido',
          data: campaigns.index_by { |c| c.title.presence || "Campanha ##{c.id}" }
                .transform_values { |c| c.achieved.to_i }
        }
      ]
    end
  end
end
