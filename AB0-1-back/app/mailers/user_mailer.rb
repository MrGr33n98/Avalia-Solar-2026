# frozen_string_literal: true

# User-related emails - TASK-018
class UserMailer < ApplicationMailer
  # Welcome email for new users
  # Usage: UserMailer.welcome(user).deliver_later
  def welcome(user)
    @user = user
    @login_url = "#{self.class.default_url_options[:protocol]}://#{self.class.default_url_options[:host]}/login"

    mail(
      to: user.email,
      subject: 'Bem-vindo ao AB0-1! 🎉'
    )
  end

  # Password reset instructions
  # Usage: UserMailer.password_reset(user, token).deliver_later
  def password_reset(user, reset_token)
    @user = user
    @reset_token = reset_token
    @reset_url = "#{self.class.default_url_options[:protocol]}://#{self.class.default_url_options[:host]}/reset-password?token=#{reset_token}"
    @expires_at = 2.hours.from_now

    mail(
      to: user.email,
      subject: 'Redefinir sua senha - AB0-1'
    )
  end

  # Email confirmation
  # Usage: UserMailer.email_confirmation(user, token).deliver_later
  def email_confirmation(user, confirmation_token)
    @user = user
    @confirmation_token = confirmation_token
    @confirmation_url = "#{self.class.default_url_options[:protocol]}://#{self.class.default_url_options[:host]}/confirm-email?token=#{confirmation_token}"

    mail(
      to: user.email,
      subject: 'Confirme seu email - AB0-1'
    )
  end

  # Account update notification
  def account_updated(user, changes)
    @user = user
    @changes = changes
    @support_url = "#{self.class.default_url_options[:protocol]}://#{self.class.default_url_options[:host]}/support"

    mail(
      to: user.email,
      subject: 'Sua conta foi atualizada - AB0-1'
    )
  end
end
