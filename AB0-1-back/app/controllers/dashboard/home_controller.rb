module Dashboard
  class HomeController < BaseController
    def index
      company = current_user.company
      @total_leads = company.leads.count
      @total_views = Article.joins(:companies).where(companies: { id: company.id }).sum(:views_count)
      @average_rating = company.rating_avg.to_f
    end
  end
end
