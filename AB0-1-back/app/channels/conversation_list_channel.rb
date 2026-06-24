# frozen_string_literal: true

class ConversationListChannel < ApplicationCable::Channel
  def subscribed
    reject unless current_user

    if current_user.review_user?
      stream_from "conversation_list:user:#{current_user.id}"
    end

    if current_user.company_user? || current_user.admin?
      company_ids.each do |company_id|
        stream_from "conversation_list:company:#{company_id}"
      end
    end
  end

  private

  def company_ids
    return Company.pluck(:id) if current_user.admin?

    ids = current_user.active_member_companies.pluck(:id)
    ids << current_user.company.id if ids.blank? && current_user.company.present?
    ids.uniq
  end
end
