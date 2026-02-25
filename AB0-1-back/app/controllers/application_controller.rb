class ApplicationController < ActionController::Base
  include Pundit::Authorization

  protect_from_forgery with: :exception, unless: -> { active_admin_request? }
  before_action :set_notifications, if: :user_signed_in?
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[email password role company_id])
    devise_parameter_sanitizer.permit(:account_update, keys: %i[email password role company_id])
  end

  private

  def active_admin_request?
    request.path.start_with?('/admin')
  end

  def set_notifications
    user = respond_to?(:current_user) ? current_user : current_admin_user
    return unless user.respond_to?(:notifications)

    Noticed::Notification.where(recipient: user).newest_first.limit(9)
    @unread = user.notifications.unread
    @read = user.notifications.read
  end

  def user_signed_in?
    (respond_to?(:current_user) && current_user) || (respond_to?(:current_admin_user) && current_admin_user)
  end
end
