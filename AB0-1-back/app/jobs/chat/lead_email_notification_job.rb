# frozen_string_literal: true

module Chat
  class LeadEmailNotificationJob < ApplicationJob
    queue_as :mailers
    retry_on StandardError, wait: :polynomially_longer, attempts: 5

    def perform(chat_lead_id)
      lead = ChatLead.includes(assigned_company: :company_members).find(chat_lead_id)
      company = lead.assigned_company
      return unless company

      recipients = company.company_members.active.includes(:user).filter_map { |member| member.user&.email }.uniq
      return if recipients.empty?

      lock_key = "chat_lead_email:#{lead.id}:#{company.id}"
      return unless Rails.cache.write(lock_key, true, expires_in: 5.minutes, unless_exist: true)

      LeadMailer.notify_company_of_new_lead(lead, recipients).deliver_now
    rescue StandardError
      Rails.cache.delete(lock_key) if defined?(lock_key) && lock_key
      raise
    end
  end
end
