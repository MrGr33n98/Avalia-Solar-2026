module Marketplace
  class ProposalDecisionService
    def initialize(proposal:, buyer:, kind:, reason: nil, version_id: nil)
      @proposal = proposal
      @buyer = buyer
      @kind = kind.to_s
      @reason = reason
      @version_id = version_id
    end

    def call
      @proposal.lead.with_lock do
        @proposal.with_lock do
          case @kind
          when 'accepted' then accept!
          when 'declined' then decline!
          when 'request_change'
            ensure_status! %w[sent viewed under_review negotiating meeting_scheduled]
            raise ArgumentError, 'Informe o que precisa ser alterado' if @reason.to_s.strip.blank?

            @proposal.request_change!(actor: @buyer, reason: @reason)
          when 'interested' then record_interest!
          else raise ArgumentError, 'Decisão inválida'
          end
        end
      end
      @proposal.reload
    end

    private

    def accept!
      ensure_status! %w[sent viewed under_review negotiating meeting_scheduled]
      if @version_id.present? && @proposal.current_version&.id != @version_id.to_i
        raise ArgumentError, 'A proposta foi atualizada. Confira a versão atual antes de escolher.'
      end
      @proposal.decisions.create!(buyer_user: @buyer, kind: 'accepted')
      @proposal.update!(status: 'accepted', accepted_at: Time.current)
      @proposal.record_event('proposal.accepted', actor: @buyer)
      close_other_proposals!
      create_project!
    end

    def decline!
      ensure_status! %w[sent viewed under_review negotiating meeting_scheduled]
      @proposal.decisions.create!(buyer_user: @buyer, kind: 'declined', reason: @reason.to_s.truncate(1000))
      @proposal.update!(status: 'declined', declined_at: Time.current)
      @proposal.record_event('proposal.declined', actor: @buyer)
    end

    def record_interest!
      ensure_status! %w[sent viewed]
      @proposal.decisions.create!(buyer_user: @buyer, kind: 'interested')
      @proposal.update!(status: 'under_review')
      @proposal.record_event('proposal.interested', actor: @buyer)
    end

    def ensure_status!(allowed)
      raise ArgumentError, 'Esta proposta expirou. Solicite uma atualização à empresa.' if @proposal.expired_for_decision?

      return if allowed.include?(@proposal.status)

      raise ArgumentError, 'Esta proposta não aceita mais decisões neste momento'
    end

    def close_other_proposals!
      MarketplaceProposal.where(lead_id: @proposal.lead_id).where.not(id: @proposal.id)
                         .where.not(status: %w[declined withdrawn expired not_selected closed_after_selection])
                         .update_all(status: 'not_selected', updated_at: Time.current)
      @proposal.record_event('proposal.selection_closed', actor: @buyer)
    end

    def create_project!
      project = @proposal.project || @proposal.create_project!(
        lead: @proposal.lead, company: @proposal.company, buyer_user: @buyer, status: 'in_progress'
      )
      return if project.milestones.exists?

      [
        ['interest_confirmed', 'Interesse confirmado'],
        ['company_contacted', 'Empresa entrou em contato'],
        ['site_visit', 'Visita técnica'],
        ['contract', 'Contrato'],
        ['installation', 'Instalação'],
        ['project_completed', 'Projeto concluído']
      ].each_with_index do |(key, title), index|
        project.milestones.create!(
          key: key, title: title, position: index, status: index.zero? ? 'completed' : 'pending',
          completed_at: index.zero? ? Time.current : nil
        )
      end
    end
  end
end
