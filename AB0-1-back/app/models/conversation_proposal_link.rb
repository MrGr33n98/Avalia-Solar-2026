# frozen_string_literal: true

class ConversationProposalLink < ApplicationRecord
  belongs_to :conversation
  belongs_to :marketplace_proposal
  belongs_to :linked_by_user, class_name: 'User', optional: true

  validates :marketplace_proposal_id, uniqueness: { scope: :conversation_id }
  validate :proposal_belongs_to_conversation_company

  private

  def proposal_belongs_to_conversation_company
    return unless conversation && marketplace_proposal

    if conversation.company_id != marketplace_proposal.company_id
      errors.add(:marketplace_proposal, 'deve pertencer à mesma empresa da conversa')
    end
  end
end
