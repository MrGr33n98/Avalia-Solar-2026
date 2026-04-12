module App
  module Painel
    class DashboardController < Painel::BaseController
      def index
        company = @current_app_company

        # KPIs — reaproveitando serviços existentes
        @stats = {
          leads_total:    company.leads.count,
          leads_new:      company.leads.where(created_at: 30.days.ago..).count,
          reviews_total:  company.reviews.count,
          reviews_avg:    company.rating_avg.to_f.round(1),
          views_total:    company.profile_views_count,
          views_30d:      (company.company_daily_stats
                                  .where(date: 30.days.ago..)
                                  .sum(:views_count) rescue 0)
        }

        # Atividades recentes (leads + reviews)
        @recent_leads   = company.leads.order(created_at: :desc).limit(5)
        @recent_reviews = company.reviews.order(created_at: :desc).limit(5)
      end
    end
  end
end
