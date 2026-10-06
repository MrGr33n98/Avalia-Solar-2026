module Marketplace
  class ProposalMeetingService
    def initialize(proposal:, buyer:, attributes:)
      @proposal = proposal
      @buyer = buyer
      @attributes = attributes
    end

    def call
      @proposal.with_lock do
        validate_request!
        meeting = @proposal.meetings.create!(@attributes.merge(buyer_user: @buyer, company: @proposal.company))
        @proposal.update!(status: 'meeting_scheduled') unless @proposal.status == 'accepted'
        @proposal.record_event('meeting.requested', actor: @buyer, metadata: { meeting_id: meeting.id })
        meeting
      end
    end

    private

    def validate_request!
      unless %w[sent viewed under_review negotiating meeting_scheduled accepted].include?(@proposal.status)
        raise ArgumentError, 'Esta proposta não permite novos agendamentos.'
      end
      if @proposal.status != 'accepted' && @proposal.expired_for_decision?
        raise ArgumentError, 'Esta proposta expirou. Solicite uma atualização à empresa.'
      end
      unless @attributes[:scheduled_at].present? && @attributes[:scheduled_at] > Time.current
        raise ArgumentError, 'Escolha uma data e um horário futuros.'
      end
    end
  end
end
