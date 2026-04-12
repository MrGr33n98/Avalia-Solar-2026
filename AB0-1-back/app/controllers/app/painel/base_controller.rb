module App
  module Painel
    class BaseController < App::BaseController
      before_action :authenticate_user!
      before_action :ensure_app_company!

      private

      def ensure_app_company!
        return if current_user.admin?
        return if @current_app_company.present?

        redirect_to app_login_path, alert: 'Acesso restrito. Faça login com uma conta de empresa.'
      end
    end
  end
end
