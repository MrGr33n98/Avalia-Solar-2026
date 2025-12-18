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
end
