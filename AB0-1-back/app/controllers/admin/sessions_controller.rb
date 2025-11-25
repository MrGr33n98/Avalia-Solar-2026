class Admin::SessionsController < ActiveAdmin::Devise::SessionsController
  skip_before_action :verify_authenticity_token, only: [:create]

  def create
    email = params.dig(:admin_user, :email)
    password = params.dig(:admin_user, :password)
    user = AdminUser.find_by(email: email)
    if user && user.valid_password?(password)
      sign_in(:admin_user, user)
      path = respond_to?(:admin_root_path) ? admin_root_path : '/admin'
      redirect_to path
    else
      flash[:alert] = 'E-mail ou senha inválidos'
      redirect_to new_admin_user_session_path, status: :see_other
    end
  end
end