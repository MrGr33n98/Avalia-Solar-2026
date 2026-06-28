class Conversation < ApplicationRecord
  STATUSES = %w[open pending_user pending_company resolved blocked].freeze
  DEFAULT_SLA_WINDOW = 4.hours

  belongs_to :user
  belongs_to :company
  has_many :direct_messages, dependent: :destroy
  has_many :conversation_events, dependent: :destroy
  has_many :conversation_reports, dependent: :destroy
  belongs_to :blocked_by, polymorphic: true, optional: true

  validates :user_id, uniqueness: { scope: :company_id }
  validates :status, inclusion: { in: STATUSES }

  scope :ordered_for_inbox, -> { order(Arel.sql('COALESCE(last_message_at, conversations.created_at) DESC')) }

  def viewer_role_for(viewer)
    return 'User' if viewer&.id == user_id && viewer.review_user?
    return 'Company' if viewer&.admin?
    return 'Company' if viewer&.company_user? && viewer.active_membership_for?(company_id)

    nil
  end

  def accessible_by?(viewer)
    viewer_role_for(viewer).present?
  end

  def unread_count_for(viewer)
    unread_count_for_role(viewer_role_for(viewer))
  end

  def unread_count_for_role(role)
    role.to_s == 'Company' ? company_unread_count.to_i : user_unread_count.to_i
  end

  def blocked?
    status == 'blocked' || blocked_at.present?
  end

  def mark_read_for!(viewer)
    role = viewer_role_for(viewer)
    return [] unless role

    unread_sender_type = role == 'Company' ? 'User' : 'Company'
    read_at = Time.current
    message_ids = direct_messages.where(sender_type: unread_sender_type, read_at: nil).pluck(:id)

    transaction do
      direct_messages.where(id: message_ids).update_all(read_at: read_at, updated_at: read_at) if message_ids.any?

      attrs = if role == 'Company'
                { company_unread_count: 0,
                  company_last_read_at: read_at }
              else
                { user_unread_count: 0,
                  user_last_read_at: read_at }
              end
      update_columns(attrs.merge(updated_at: read_at))
      if message_ids.any?
        create_event!('message.read', actor: viewer, metadata: {
                        reader_type: role,
                        message_ids: message_ids,
                        read_at: read_at.iso8601
                      })
      end
    end

    message_ids
  end

  def register_message!(message, actor:)
    with_lock do
      now = message.created_at || Time.current
      attrs = {
        last_message_at: now,
        resolved_at: nil,
        status: message.sender_type == 'User' ? 'pending_company' : 'pending_user'
      }

      if message.sender_type == 'User'
        attrs[:company_unread_count] = company_unread_count.to_i + 1
        attrs[:sla_due_at] = now + DEFAULT_SLA_WINDOW
      else
        attrs[:user_unread_count] = user_unread_count.to_i + 1
        attrs[:sla_due_at] = nil
      end

      update!(attrs)
    end

    create_event!('message.created', actor: actor, metadata: {
                    message_id: message.id,
                    sender_type: message.sender_type
                  })
  end

  def resolve!(actor:)
    update!(status: 'resolved', resolved_at: Time.current, sla_due_at: nil)
    create_event!('conversation.resolved', actor: actor)
  end

  def reopen!(actor:)
    update!(status: 'open', resolved_at: nil, blocked_at: nil, block_reason: nil, blocked_by: nil)
    create_event!('conversation.reopened', actor: actor)
  end

  def block!(actor:, reason: nil)
    update!(
      status: 'blocked',
      blocked_at: Time.current,
      blocked_by: actor,
      block_reason: reason.presence,
      sla_due_at: nil
    )
    create_event!('conversation.blocked', actor: actor, metadata: { reason: reason.presence }.compact)
  end

  def report!(actor:, reason:, details: nil)
    report = conversation_reports.create!(
      reporter: actor,
      reason: reason.presence || 'other',
      details: details.presence,
      metadata: { reporter_role: viewer_role_for(actor) }.compact
    )
    increment!(:report_count)
    create_event!('conversation.reported', actor: actor, metadata: {
                    report_id: report.id,
                    reason: report.reason
                  })
    report
  end

  def create_event!(event_type, actor: nil, metadata: {})
    conversation_events.create!(
      actor: actor,
      event_type: event_type,
      metadata: metadata || {},
      created_at: Time.current
    )
  end

  def company_recipient_user_ids
    company.company_members.where(status: 'active').pluck(:user_id)
  end
end
