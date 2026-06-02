module Api
  module V1
    module Admin
      class BaseController < Api::V1::BaseController
        before_action :authenticate_api_user
        before_action :require_admin
        after_action :log_admin_action

        private

        def log_admin_action
          return unless current_user

          # Simple logging for now. In a real enterprise app, this would go to a dedicated AuditLog table.
          Rails.logger.info "[ADMIN API] UserID=#{current_user.id} Controller=#{controller_name} Action=#{action_name}"
        end
      end
    end
  end
end
