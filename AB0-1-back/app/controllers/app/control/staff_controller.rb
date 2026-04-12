module App
  module Control
    class StaffController < BaseController
      before_action :ensure_owner_access!

      def show; end
    end
  end
end
