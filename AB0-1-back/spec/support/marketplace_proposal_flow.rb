# frozen_string_literal: true

module MarketplaceProposalFlowHelper
  def create_marketplace_proposal_flow(buyer: nil, company: nil, status: 'sent', with_project: false)
    buyer ||= FactoryBot.create(:user, :buyer, :confirmed)
    company ||= FactoryBot.create(:company)
    lead = FactoryBot.create(:lead, email: buyer.email, city: 'Florianópolis', state: 'SC')
    distribution = FactoryBot.create(:lead_distribution, lead: lead, company: company)

    proposal = MarketplaceProposal.create!(
      reference: "PROP-#{SecureRandom.hex(4).upcase}",
      lead: lead,
      lead_distribution: distribution,
      company: company,
      buyer_user: buyer,
      status: 'draft',
      total_cents: 2_500_000,
      currency: 'BRL'
    )

    version = proposal.versions.create!(
      number: 1,
      status: 'published',
      title: 'Proposta Fotovoltaica Racional 8kWp',
      summary: 'Sistema completo com 16 painéis de 500W e inversor de 8kW',
      total_cents: 2_500_000,
      currency: 'BRL',
      valid_until: 30.days.from_now.to_date,
      published_at: Time.current
    )

    version.items.create!(
      kind: 'equipment',
      name: 'Painel Solar 500W Mono PERC',
      description: 'Módulo fotovoltaico de alta eficiência',
      quantity: 16,
      unit: 'un',
      unit_price_cents: 100_000,
      total_cents: 1_600_000,
      position: 1
    )

    version.items.create!(
      kind: 'service',
      name: 'Instalação e Homologação',
      description: 'Mão de obra especializada e entrada na concessionária',
      quantity: 1,
      unit: 'serv',
      unit_price_cents: 900_000,
      total_cents: 900_000,
      position: 2
    )

    version.terms.create!(key: 'system_power', label: 'Potência instalada', value: '8.0 kWp', position: 1)
    version.terms.create!(key: 'monthly_generation', label: 'Geração estimada', value: '1.050 kWh/mês', position: 2)
    version.terms.create!(key: 'warranty', label: 'Garantia', value: '12 anos painéis / 10 anos inversor', position: 3)
    version.terms.create!(key: 'installation_deadline', label: 'Prazo de instalação', value: '25 dias úteis', position: 4)

    if status != 'draft'
      proposal.update!(status: status, published_at: Time.current, current_version_number: 1)
    end

    if with_project
      project = proposal.create_project!(
        company: company,
        buyer_user: buyer,
        status: 'in_progress',
        started_at: Time.current
      )

      project.milestones.create!(
        key: 'engineering',
        title: 'Projeto Elétrico & Homologação',
        status: 'completed',
        position: 1,
        completed_at: 2.days.ago
      )

      project.milestones.create!(
        key: 'installation',
        title: 'Montagem e Instalação Física',
        status: 'in_progress',
        position: 2,
        scheduled_at: 5.days.from_now
      )

      project.milestones.create!(
        key: 'inspection',
        title: 'Vistoria da Concessionária e Troca de Medidor',
        status: 'pending',
        position: 3
      )
    end

    {
      buyer: buyer,
      company: company,
      lead: lead,
      distribution: distribution,
      proposal: proposal,
      version: version
    }
  end
end

RSpec.configure do |config|
  config.include MarketplaceProposalFlowHelper
end
