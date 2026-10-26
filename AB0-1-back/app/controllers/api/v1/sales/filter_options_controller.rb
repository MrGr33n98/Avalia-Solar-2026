# frozen_string_literal: true

module Api
  module V1
    module Sales
      class FilterOptionsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          options = ::Sales::LeadFilterOptionsQuery.call(current_user)
          render json: { options: options }
        end
      end
    end
  end
end
