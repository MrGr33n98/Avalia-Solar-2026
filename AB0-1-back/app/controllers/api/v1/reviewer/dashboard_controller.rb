# frozen_string_literal: true

module Api
  module V1
    module Reviewer
      class DashboardController < Api::V1::Reviewer::BaseController
        def show
          render json: ::Reviewer::DashboardService.new(user: current_user).call
        end

        def analytics
          profile = current_user.reviewer_profile
          return render json: { error: 'Perfil de criador não encontrado' }, status: :not_found unless profile

          render json: ::Reviewer::AnalyticsSummaryService.new(user: current_user, profile: profile).call
        end
      end
    end
  end
end
