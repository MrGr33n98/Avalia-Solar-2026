class UserMailer < Devise::Mailer
  default from: ENV.fetch('MAILER_FROM_EMAIL', 'noreply@ab0-1.com')
  layout 'mailer'

  def approval_email(user)
    @user = user
    mail(to: @user.email, subject: 'Sua conta foi aprovada!')
  end

  def rejection_email(user)
    @user = user
    mail(to: @user.email, subject: 'Atualização sobre sua conta')
  end

  def email_confirmation(user, token)
    @user = user
    @token = token
    # Use the frontend URL for confirmation
    frontend_url = ENV.fetch('FRONTEND_URL', 'https://avaliasolar.com.br')

    # SEGURANÇA: O frontend espera o token no hash fragment (#token=...)
    # para evitar que o token vaze em logs de servidor ou analytics.
    @confirmation_url = "#{frontend_url}/confirm-email#token=#{token}"

    Rails.logger.info "[Audit] Generating confirmation email for #{user.email}. URL: #{@confirmation_url}"

    mail(to: @user.email, subject: 'Confirme seu e-mail', template_name: 'email_confirmation')
  end

  def confirmation_instructions(user, token, _opts = {})
    email_confirmation(user, token)
  end

  def reset_password_instructions(user, token, _opts = {})
    @user = user
    @token = token
    frontend_url = ENV.fetch('FRONTEND_URL', 'https://avaliasolar.com.br')
    @reset_password_url = "#{frontend_url}/reset-password#token=#{token}"

    mail(to: @user.email, subject: 'Redefinição de senha')
  end

  def welcome(user)
    @user = user
    @frontend_url = ENV.fetch('FRONTEND_URL', 'https://avaliasolar.com.br')
    @login_url = "#{@frontend_url}/login"
    @dashboard_url = @user.company_user? ? "#{@frontend_url}/select-company" : @frontend_url
    mail(to: @user.email, subject: 'Bem-vindo ao Avalia Solar! ☀️')
  end
end
