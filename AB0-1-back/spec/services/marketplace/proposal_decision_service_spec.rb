require 'rails_helper'

RSpec.describe Marketplace::ProposalDecisionService, type: :service do
  def published_version(proposal, number: 1)
    version = proposal.versions.create!(
      number: number,
      title: "Proposta v#{number}",
      status: 'published',
      total_cents: 2_690_000,
      published_at: Time.current
    )
    proposal.update!(current_version_number: number, total_cents: version.total_cents)
    version
  end

  it 'aceita uma proposta, cria projeto e encerra as concorrentes' do
    buyer = create(:user)
    lead = create(:lead, email: buyer.email)
    first_distribution = create(:lead_distribution, lead: lead)
    second_distribution = create(:lead_distribution, lead: lead)
    first = create(:marketplace_proposal, lead: lead, lead_distribution: first_distribution, buyer_user: buyer,
                                          company: first_distribution.company, status: 'sent')
    second = create(:marketplace_proposal, lead: lead, lead_distribution: second_distribution, buyer_user: buyer,
                                           company: second_distribution.company, status: 'sent')
    first_version = published_version(first)
    published_version(second)

    described_class.new(
      proposal: first,
      buyer: buyer,
      kind: 'accepted',
      version_id: first_version.id
    ).call

    expect(first.reload.status).to eq('accepted')
    expect(first.project).to be_present
    expect(second.reload.status).to eq('not_selected')
    expect(first.project.milestones.count).to eq(6)
  end

  it 'rejeita o aceite de uma versão que deixou de ser a atual' do
    buyer = create(:user)
    distribution = create(:lead_distribution)
    proposal = create(
      :marketplace_proposal,
      lead: distribution.lead,
      lead_distribution: distribution,
      company: distribution.company,
      buyer_user: buyer,
      status: 'sent'
    )
    old_version = published_version(proposal)
    published_version(proposal, number: 2)

    expect do
      described_class.new(
        proposal: proposal,
        buyer: buyer,
        kind: 'accepted',
        version_id: old_version.id
      ).call
    end.to raise_error(ArgumentError, /atualizada/)

    expect(proposal.reload.status).to eq('sent')
  end
end
