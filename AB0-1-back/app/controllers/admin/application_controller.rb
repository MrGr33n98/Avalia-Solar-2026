class Admin::ApplicationController < ActiveAdmin::BaseController
  # Skip the set_notifications before_action from ApplicationController
  skip_before_action :set_notifications

  # ActiveAdmin relies on Devise's `current_admin_user`, but other parts of the
  # application expect `current_user`. Provide a lightweight bridge so shared
  # helpers and callbacks work within the admin namespace without blowing up.
  helper_method :current_user

  def access_denied(exception)
    redirect_to admin_root_path, alert: "Você não tem permissão para acessar esta página."
  rescue ActionController::Redirecting::Error
    redirect_to root_path, alert: "Você não tem permissão para acessar esta página."
  end

  private

  def current_user
    current_admin_user
  end
end
