# frozen_string_literal: true

module Messaging
  class P2pInboxAdapter
    class << self
      def adapt(conversation, viewer:)
        role = conversation.viewer_role_for(viewer)
        unread = conversation.unread_count_for_role(role)

        last_msg = if conversation.association(:direct_messages).loaded?
                     conversation.direct_messages.sort_by { |m| m.created_at || Time.at(0) }.last
                   else
                     conversation.direct_messages.order(created_at: :desc).first
                   end

        participant = if role == 'Company'
                        {
                          type: 'buyer',
                          id: conversation.user_id,
                          name: conversation.user&.name || 'Cliente',
                          email: conversation.user&.email,
                          avatar_url: conversation.user&.avatar_url
                        }
                      else
                        {
                          type: 'company',
                          id: conversation.company_id,
                          name: conversation.company&.name || 'Empresa',
                          logo_url: conversation.company&.logo_url
                        }
                      end

        last_message_dto = if last_msg
                             {
                               id: last_msg.id,
                               body: last_msg.body,
                               sender_type: last_msg.sender_type,
                               created_at: last_msg.created_at.iso8601,
                               read_at: last_msg.read_at&.iso8601
                             }
                           end

        sla_dto = if conversation.sla_due_at.present?
                    {
                      due_at: conversation.sla_due_at.iso8601,
                      breached: Time.current > conversation.sla_due_at
                    }
                  end

        linked_proposals = if conversation.respond_to?(:conversation_proposal_links)
                             conversation.conversation_proposal_links.includes(:marketplace_proposal).map do |link|
                               p = link.marketplace_proposal
                               next unless p
                               next unless viewer.nil? || MarketplaceProposalPolicy.new(viewer, p).conversation?

                               {
                                 id: p.id,
                                 reference: p.reference,
                                 status: p.status,
                                 has_published_version: p.current_version.present?
                               }
                             end.compact
                           else
                             []
                           end

        capabilities = {
          can_reply: conversation.status != 'blocked',
          can_resolve: role == 'Company' && conversation.status != 'resolved',
          can_block: true,
          can_attach: true
        }

        InboxItemSerializer.format_dto(
          composite_id: "p2p:#{conversation.id}",
          channel: 'p2p',
          status: conversation.status,
          company_id: conversation.company_id,
          participant: participant,
          last_message: last_message_dto,
          unread_count: unread,
          sla: sla_dto,
          lead: nil,
          marketplace_proposal_id: conversation.marketplace_proposal_id,
          marketplace_proposal_reference: conversation.marketplace_proposal&.reference,
          linked_proposals: linked_proposals,
          capabilities: capabilities,
          updated_at: conversation.last_message_at || conversation.updated_at || conversation.created_at
        )
      end
    end
  end
end
