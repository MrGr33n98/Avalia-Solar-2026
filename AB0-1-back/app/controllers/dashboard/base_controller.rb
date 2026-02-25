module Dashboard
  class BaseController < ApplicationController
    before_action :authenticate_user!
    before_action :ensure_dashboard_access

    layout 'dashboard'

    private

    def ensure_dashboard_access
      return if current_user.review_user?

      company = current_user.company
      return if current_user.approved_by_admin? && company&.status == 'active'

      redirect_to waiting_approval_path
    end
  end
end
