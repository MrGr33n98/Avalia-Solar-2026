module Api
  module V1
    module Dashboard
      class CompaniesController < BaseController
        def update
          current_company.pending_changes.create!(
            change_type: 'profile_update',
            status: 'pending',
            user: current_user,
            data: {
              attributes: company_params
            }
          )

          render json: { message: 'Change pending admin approval' }, status: :accepted
        end

        private

        def company_params
          params.require(:company).permit(:name, :description, :whatsapp, :social_media)
        end
      end
    end
  end
end
