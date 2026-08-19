# frozen_string_literal: true

module Messaging
  class InboxItemSerializer
    class << self
      def serialize(item)
        case item
        when Hash
          item
        else
          item.try(:to_h) || {}
        end
      end

      def format_dto(
        composite_id:,
        channel:, # 'p2p' | 'ai' | 'creator'
        status:,
        company_id:,
        participant:,
        last_message:,
        unread_count:,
        sla: nil,
        lead: nil,
        updated_at:
      )
        {
          id: composite_id,
          channel: channel,
          status: status,
          company_id: company_id,
          participant: participant,
          last_message: last_message,
          unread_count: unread_count,
          sla: sla,
          lead: lead,
          updated_at: updated_at.respond_to?(:iso8601) ? updated_at.iso8601(6) : updated_at
        }
      end
    end
  end
end
