# frozen_string_literal: true

# Generic notifications - TASK-018
class NotificationMailer < ApplicationMailer
  # Generic notification email
  def notify(recipient_email, subject, message)
    @message = message
    
    mail(
      to: recipient_email,
      subject: subject
    )
  end

  # Admin alert
  def admin_alert(admin_email, alert_type, details)
    @alert_type = alert_type
    @details = details
    @timestamp = Time.current

    mail(
      to: admin_email,
      subject: "⚠️ Admin Alert: #{alert_type}"
    )
  end

  # System notification
  def system_notification(user, notification_type, data)
    @user = user
    @notification_type = notification_type
    @data = data

    mail(
      to: user.email,
      subject: notification_subject(notification_type)
    )
  end

  private

  def notification_subject(type)
    case type
    when 'new_follower' then 'Você tem um novo seguidor!'
    when 'new_comment' then 'Novo comentário na sua avaliação'
    when 'review_helpful' then 'Sua avaliação foi marcada como útil'
    when 'company_response' then 'A empresa respondeu sua avaliação'
    else 'Nova notificação - AB0-1'
    end
  end
end
