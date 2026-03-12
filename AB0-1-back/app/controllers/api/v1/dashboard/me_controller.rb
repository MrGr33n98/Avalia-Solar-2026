module Api
  module V1
    module Dashboard
      class MeController < BaseController
        def show
          company = current_company

          render json: {
            user: user_payload,
            permissions: {
              approved: current_user.approved_for_dashboard?,
              plan: company&.plan&.name,
              features: company&.effective_plan_features || {},
              feature_access: company&.feature_access || {}
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
