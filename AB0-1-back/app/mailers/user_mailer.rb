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
    frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
    @confirmation_url = "#{frontend_url}/confirm-email/#{token}"
    
    mail(to: @user.email, subject: 'Confirme seu e-mail', template_name: 'email_confirmation')
  end

  def confirmation_instructions(user, token, opts = {})
    email_confirmation(user, token)
  end
end
