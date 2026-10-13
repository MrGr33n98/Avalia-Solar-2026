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
        marketplace_proposal_id: nil,
        marketplace_proposal_reference: nil,
        linked_proposals: [],
        capabilities: {},
        updated_at:
      )
        {
          id: composite_id,
          raw_id: composite_id.to_s.split(':', 2).last.to_i,
          channel: channel,
          status: status,
          company_id: company_id,
          participant: participant,
          last_message: last_message,
          unread_count: unread_count.to_i,
          sla: sla,
          lead: lead,
          marketplace_proposal_id: marketplace_proposal_id,
          marketplace_proposal_reference: marketplace_proposal_reference,
          linked_proposals: linked_proposals || [],
          capabilities: capabilities || {},
          updated_at: updated_at.respond_to?(:iso8601) ? updated_at.iso8601(6) : updated_at.to_s
        }
      end
    end
  end
end
