module App
  class SessionsController < ApplicationController
    layout 'app_auth'

    before_action :redirect_if_signed_in, only: %i[new create]

    def new
      @email = params[:email]
    end

    def create
      user = User.find_by(email: params[:email]&.downcase&.strip)

      if user&.valid_password?(params[:password])
        sign_in(user)
        redirect_to app_painel_root_path, notice: 'Bem-vindo de volta!'
      else
        flash.now[:alert] = 'E-mail ou senha incorretos.'
        @email = params[:email]
        render :new, status: :unprocessable_entity
      end
    end

    def destroy
      sign_out(current_user)
      redirect_to app_login_path, notice: 'Sessão encerrada.'
    end

    private

    def redirect_if_signed_in
      redirect_to app_painel_root_path if user_signed_in?
    end
  end
end
