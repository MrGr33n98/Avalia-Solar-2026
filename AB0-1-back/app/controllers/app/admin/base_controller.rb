module App
  module Admin
    class BaseController < App::BaseController
      before_action :authenticate_user!
      before_action :require_super_admin!

      layout 'app'

      private

      def require_super_admin!
        return if current_user&.admin?

        redirect_to app_root_path, alert: 'Acesso não autorizado.'
      end
    end
  end
end
