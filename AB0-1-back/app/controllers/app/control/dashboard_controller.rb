module App
  module Control
    class DashboardController < BaseController
      def index
        @control_summary = {
          catalog_products: @current_app_company.products.count,
          active_members: @current_app_company.company_members.active.count,
          pending_members: @current_app_company.company_members.pending.count,
          reviews_total: @current_app_company.reviews.count
        }
      end
    end
  end
end
