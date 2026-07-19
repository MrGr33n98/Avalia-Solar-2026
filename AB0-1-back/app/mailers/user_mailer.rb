class UserMailer < Devise::Mailer
  helper MailerHelper
  include MailerHelper

  default from: ENV.fetch('MAILER_FROM_EMAIL', 'noreply@avaliasolar.com.br')
  layout 'mailer'

  def frontend_url(path = '/')
    mailer_absolute_url(path)
  end

  helper_method :frontend_url

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
    # SEGURANÇA: O frontend espera o token no hash fragment (#token=...)
    # para evitar que o token vaze em logs de servidor ou analytics.
    @confirmation_url = mailer_absolute_url("/confirm-email#token=#{token}")

    Rails.logger.info "[Audit] Generating confirmation email for user #{user.id}"

    mail(to: @user.email, subject: 'Confirme seu e-mail', template_name: 'email_confirmation')
  end

  def confirmation_instructions(user, token, _opts = {})
    email_confirmation(user, token)
  end

  def reset_password_instructions(user, token, _opts = {})
    @user = user
    @token = token
    @reset_password_url = mailer_absolute_url("/reset-password#token=#{token}")

    mail(to: @user.email, subject: 'Redefinição de senha')
  end

  # Compatibility entry point used by PasswordResetEmailJob.
  def password_reset(user, token)
    @user = user
    @reset_password_url = mailer_absolute_url("/reset-password#token=#{token}")
    mail(to: @user.email, subject: 'Redefinição de senha')
  end

  def account_updated(user, changes)
    @user = user
    @changes = changes
    mail(to: @user.email, subject: 'Dados da sua conta foram atualizados')
  end

  def welcome(user)
    @user = user
    @frontend_url = mailer_site_url
    @login_url = mailer_absolute_url('/login')
    @dashboard_url = @user.company_user? ? mailer_absolute_url('/select-company') : @frontend_url
    mail(to: @user.email, subject: 'Bem-vindo ao Avalia Solar')
  end
end
