# frozen_string_literal: true

module Api
  module V1
    module Reviewer
      class DashboardController < Api::V1::Reviewer::BaseController

        def show
          render json: ::Reviewer::DashboardService.new(user: current_user).call
        end

        private

      end
    end
  end
end
