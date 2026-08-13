module Api
  module V1
    module Reviewer
      class BaseController < Api::V1::BaseController
        before_action :authenticate_api_user
        before_action :require_reviewer_role

        private

        def require_reviewer_role
          require_role('review', 'admin')
        end
      end
    end
  end
end
