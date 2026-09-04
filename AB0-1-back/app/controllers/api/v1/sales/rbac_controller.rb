module Api
  module V1
    module Sales
      class RbacController < BaseController
        def index
          roles = ::Sales::Role.includes(:permissions).order(:name)
          users_scope = current_user&.company ? current_user.company.users.includes(:sales_roles) : User.none
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
