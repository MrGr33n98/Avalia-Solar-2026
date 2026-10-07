# frozen_string_literal: true

module Marketplace
  class ProjectBootstrapService
    DEFAULT_MILESTONES = [
      { key: 'interest_confirmed', title: 'Interesse confirmado' },
      { key: 'company_contacted', title: 'Empresa entrou em contato' },
      { key: 'site_visit', title: 'Visita técnica' },
      { key: 'contract', title: 'Contrato assinado' },
      { key: 'installation', title: 'Instalação e Montagem' },
      { key: 'project_completed', title: 'Projeto concluído e Homologado' }
    ].freeze

    def initialize(proposal:, buyer:)
      @proposal = proposal
      @buyer = buyer
    end

    def call
      proposal.with_lock do
        project = proposal.project || proposal.create_project!(
          lead: proposal.lead,
          company: proposal.company,
          buyer_user: buyer,
          status: 'in_progress',
          started_at: Time.current
        )

        bootstrap_milestones!(project)
        project
      end
    end

    private

    attr_reader :proposal, :buyer

    def bootstrap_milestones!(project)
      return if project.milestones.exists?

      DEFAULT_MILESTONES.each_with_index do |item, index|
        project.milestones.create!(
          key: item[:key],
          title: item[:title],
          position: index + 1,
          status: index.zero? ? 'completed' : 'pending',
          completed_at: index.zero? ? Time.current : nil
        )
      end
    end
  end
end
