class CreatorLeadNotificationJob < ApplicationJob
  queue_as :default

  def perform(lead_id)
    lead = CreatorLead.includes(:creator_user).find_by(id: lead_id)
    return unless lead

    NotificationMailer.system_notification(
      lead.creator_user,
      'creator_lead_received',
      { lead_id: lead.id, creator_slug: lead.creator_user.reviewer_profile&.public_slug }
    ).deliver_now
  end
end
