class ApplicationController < ActionController::Base
  include Pundit::Authorization

  protect_from_forgery with: :exception, unless: -> { active_admin_request? }
  layout :layout_by_resource
  before_action :set_notifications, if: :user_signed_in?
  before_action :configure_permitted_parameters, if: :devise_controller?
  after_action :prevent_backend_indexing

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[email password role company_id])
    devise_parameter_sanitizer.permit(:account_update, keys: %i[email password role company_id])
  end

  private

  def layout_by_resource
    if devise_controller? || doorkeeper_controller?
      'app_auth'
    else
      'application'
    end
  end

  def doorkeeper_controller?
    self.class.name.to_s.start_with?('Doorkeeper::')
  end

  # ActiveAdmin e o dashboard público podem coexistir no mesmo navegador. Sem
  # esta seleção explícita, o Pundit pode receber o `current_user` da sessão
  # pública (empresa/reviewer) numa rota /admin e negar uma ação que o
  # `current_admin_user` autenticado pode executar.
  def pundit_user
    if active_admin_request? && respond_to?(:current_admin_user, true)
      admin = current_admin_user
      return admin if admin.present?
    end

    current_user if respond_to?(:current_user, true)
  end

  def prevent_backend_indexing
    response.set_header('X-Robots-Tag', 'noindex, nofollow, noarchive')
  end

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

  # ActiveAdmin calls the configured unauthorized handler via public_send.
  # Keeping it private turns a legitimate 403 into a 500 (NoMethodError).
  public

  def access_denied(_exception)
    if active_admin_request?
      redirect_to admin_root_path, alert: 'Você não tem permissão para executar esta ação.'
    else
      redirect_to root_path, alert: 'Você não tem permissão para executar esta ação.'
    end
  end
end
