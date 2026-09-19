module Api
  module V1
    module Sales
      class UserRolesController < BaseController
        before_action -> { require_sales_permission!('settings', 'manage') }

        def create
          user_to_assign = User.find(params[:user_id])
          role_to_assign = ::Sales::Role.find(params[:role_id])
          assignment = ::Sales::UserRole.create!(user: user_to_assign, role: role_to_assign)
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
