module Api
  module V1
    module Sales
      class UserRolesController < BaseController
        def create
          assignment = ::Sales::UserRole.create!(user_id: params[:user_id], role_id: params[:role_id])
          render json: { user_id: assignment.user_id, role_id: assignment.role_id }, status: :created
        end

        def destroy
          ::Sales::UserRole.find_by!(user_id: params[:user_id], role_id: params[:role_id]).destroy!
          head :no_content
        end
      end
    end
  end
end
