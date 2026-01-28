# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  skip_before_action :verify_authenticity_token, only: [:google_oauth2, :linkedin]

  def google_oauth2
    handle_oauth('Google')
  end

  def linkedin
    handle_oauth('LinkedIn')
  end

  def failure
    redirect_to root_path, alert: "Autenticação falhou: #{params[:message]}"
  end

  private

  def handle_oauth(provider_name)
    @user = User.from_omniauth(request.env['omniauth.auth'])

    if @user.persisted?
      # Check if user needs admin approval
      if @user.company_user? && !@user.approved_by_admin?
        # User exists but needs approval
        flash[:notice] = "Sua conta foi criada e está aguardando aprovação do administrador."
        redirect_to new_user_session_path
      elsif !@user.active?
        # User is rejected or blocked
        flash[:alert] = case @user.status
                        when 'rejected'
                          "Sua conta foi rejeitada. Entre em contato com o suporte."
                        when 'blocked'
                          "Sua conta foi bloqueada. Entre em contato com o suporte."
                        else
                          "Sua conta está inativa. Entre em contato com o suporte."
                        end
        redirect_to new_user_session_path
      else
        # User is approved and active
        sign_in_and_redirect @user, event: :authentication
        set_flash_message(:notice, :success, kind: provider_name) if is_navigational_format?
      end
    else
      session["devise.#{request.env['omniauth.auth'].provider}_data"] = request.env['omniauth.auth'].except('extra')
      redirect_to new_user_registration_url, alert: "Falha ao autenticar com #{provider_name}."
    end
  end
end
