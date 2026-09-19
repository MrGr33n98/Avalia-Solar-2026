module Api
  module V1
    module Sales
      class RbacController < BaseController
        before_action -> { require_sales_permission!('settings', 'manage') }

        def index
          roles = ::Sales::Role.includes(:permissions).order(:name)
          users_scope = User.joins(:sales_user_roles).distinct.includes(:sales_roles)
          render json: {
            roles: roles.map { |role| { id: role.id, name: role.name, slug: role.slug, key: role.slug,
                                       permissions: role.permissions.map { |permission| "#{permission.resource}:#{permission.action}" } } },
            users: users_scope.map { |u| { id: u.id, email: u.email, roles: u.sales_roles.map(&:name) } }
          }
        end

        def create
          role = ::Sales::Role.create!(role_params)
          render json: { role: { id: role.id, name: role.name, slug: role.slug } }, status: :created
        end

        private

        def role_params
          params.require(:role).permit(:company_id, :name, :slug, :system)
        end
      end
    end
  end
end
