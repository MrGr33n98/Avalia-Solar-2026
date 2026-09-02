module Api
  module V1
    module Sales
      class RbacController < BaseController
        def index
          roles = ::Sales::Role.includes(:permissions).order(:name)
          render json: { roles: roles.map { |role| { id: role.id, name: role.name, slug: role.slug,
                                                     permissions: role.permissions.map { |permission| "#{permission.resource}:#{permission.action}" } } } }
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
