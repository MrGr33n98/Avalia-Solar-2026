module Api
  module V1
    module Dashboard
      class MeController < BaseController
      def show
        render json: {
          user: user_payload,
          permissions: {
            approved: current_user.approved_for_dashboard?,
            plan: current_company.plan&.name,
            features: current_company.plan_features
          }
        }
      end

      private

      def user_payload
        current_user.as_json(
          only: %i[id email name role company_id status approved_by_admin created_at]
        )
      end
      end
    end
  end
end
