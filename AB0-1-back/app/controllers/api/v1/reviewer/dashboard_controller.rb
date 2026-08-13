# frozen_string_literal: true

module Api
  module V1
    module Reviewer
      class DashboardController < BaseController
        before_action :authenticate_api_user
        before_action :require_reviewer_role

        def show
          render json: ::Reviewer::DashboardService.new(user: current_user).call
        end

        private

        def require_reviewer_role
          require_role('review', 'admin')
        end
      end
    end
  end
end
