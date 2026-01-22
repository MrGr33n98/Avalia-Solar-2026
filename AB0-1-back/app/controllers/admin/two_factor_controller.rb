class Admin::TwoFactorController < ApplicationController
  before_action :authenticate_admin_user!
  
  def show
    # Gera secret se não existir
    current_admin_user.otp_secret ||= Devise::TwoFactor.generate_secret
    current_admin_user.save!
  end
  
  def manage
    # Página de gerenciamento do 2FA
  end
  
  def enable
    if current_admin_user.validate_and_consume_otp!(params[:code])
      current_admin_user.update!(otp_required_for_login: true)
      @recovery_codes = current_admin_user.generate_otp_backup_codes!
      render 'backup_codes'
    else
      flash.now[:alert] = "Código de verificação inválido"
      render 'show'
    end
  end
  
  def disable
    current_admin_user.update!(otp_required_for_login: false)
    redirect_to admin_root_path, notice: "Autenticação de dois fatores desativada com sucesso"
  end
  
  def backup_codes
    # Essa ação é chamada para exibir os códigos de recuperação
    @recovery_codes = current_admin_user.otp_backup_codes
  end
  
  def regenerate_backup_codes
    @recovery_codes = current_admin_user.generate_otp_backup_codes!
    render 'backup_codes'
  end
end