class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception, unless: -> { active_admin_request? }
  before_action :set_notifications, if: :user_signed_in?

  private

  def active_admin_request?
    request.path.start_with?('/admin')
  end

  private

  def set_notifications
    user = respond_to?(:current_user) ? current_user : current_admin_user
    return unless user && user.respond_to?(:notifications)

    Noticed::Notification.where(recipient: user).newest_first.limit(9)
    @unread = user.notifications.unread
    @read = user.notifications.read
  end

  def user_signed_in?
    (respond_to?(:current_user) && current_user) || (respond_to?(:current_admin_user) && current_admin_user)
  end
end
