# frozen_string_literal: true

# Notification service - TASK-019
# Centralized service for creating and managing notifications
class NotificationService
  # Send notification to a single user
  def self.notify(user, type, title, **options)
    CreateNotificationJob.perform_later(
      user.id,
      type,
      title,
      options
    )
  end

  # Send notification to multiple users
  def self.notify_bulk(users, type, title, **options)
    user_ids = users.respond_to?(:pluck) ? users.pluck(:id) : users.map(&:id)
    BulkNotificationJob.perform_later(user_ids, type, title, options)
  end

  # Specific notification types
  def self.new_review(user, review)
    notify(
      user,
      'new_review',
      'Nova avaliação recebida',
      message: "Você recebeu uma nova avaliação de #{review.rating} estrelas",
      notifiable: review,
      data: { review_id: review.id, rating: review.rating },
      delivery_channels: ['in_app', 'email']
    )
  end

  def self.review_response(user, review, response)
    notify(
      user,
      'review_response',
      'Resposta na sua avaliação',
      message: "A empresa respondeu sua avaliação",
      notifiable: response,
      data: { review_id: review.id, response_id: response.id },
      delivery_channels: ['in_app', 'email']
    )
  end

  def self.new_follower(user, follower)
    notify(
      user,
      'new_follower',
      'Novo seguidor',
      message: "#{follower.name} começou a seguir você",
      notifiable: follower,
      data: { follower_id: follower.id },
      delivery_channels: ['in_app']
    )
  end

  def self.new_comment(user, comment)
    notify(
      user,
      'new_comment',
      'Novo comentário',
      message: "Alguém comentou na sua avaliação",
      notifiable: comment,
      data: { comment_id: comment.id },
      delivery_channels: ['in_app']
    )
  end

  def self.review_helpful(user, review)
    notify(
      user,
      'review_helpful',
      'Avaliação útil',
      message: "Sua avaliação foi marcada como útil",
      notifiable: review,
      data: { review_id: review.id },
      delivery_channels: ['in_app']
    )
  end

  def self.security_alert(user, alert_type, message)
    notify(
      user,
      'security_alert',
      'Alerta de segurança',
      message: message,
      data: { alert_type: alert_type },
      delivery_channels: ['in_app', 'email']
    )
  end

  def self.system_message(user, message)
    notify(
      user,
      'system_message',
      'Mensagem do sistema',
      message: message,
      delivery_channels: ['in_app']
    )
  end

  # Broadcast to all users
  def self.broadcast(type, title, message)
    user_ids = User.pluck(:id)
    notify_bulk(user_ids, type, title, message: message)
  end
end
