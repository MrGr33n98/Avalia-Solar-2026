module App
  module Admin
    class DashboardController < Admin::BaseController
      def index
        @total_suppliers    = Company.suppliers.count
        @total_integrators  = Company.integrators.count
        @total_distributors = Company.distributors.count
        @total_finances     = Company.finances.count
        @pending_approval   = Company.app_segment.where(moderation_status: 'pending').count
        @recent_companies   = Company.app_segment.order(created_at: :desc).limit(10)
      end
    end
  end
end
