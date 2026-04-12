module App
  module Control
    class BaseController < App::BaseController
      layout 'app_control'

      before_action :ensure_control_access!

      helper_method :current_control_membership, :current_control_role, :control_owner?

      private

      def current_control_membership
        return @current_control_membership if defined?(@current_control_membership)
        return @current_control_membership = nil unless current_user && @current_app_company

        @current_control_membership =
          current_user.active_company_members.find_by(company_id: @current_app_company.id)
      end

      def current_control_role
        current_control_membership&.role
      end

      def control_owner?
        current_control_role == 'owner'
      end

      def control_manager?
        current_control_role == 'manager'
      end

      def ensure_control_access!
        return if control_owner? || control_manager?

        redirect_to app_painel_root_path,
                    alert: 'Você não tem permissão para acessar o Control Panel desta empresa.'
      end

      def ensure_owner_access!
        return if control_owner?

        redirect_to app_control_root_path,
                    alert: 'Somente owners podem acessar esta área do Control Panel.'
      end
    end
  end
end
