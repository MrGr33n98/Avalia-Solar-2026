# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Marketplace::ProposalBootstrapService, type: :service do
  let(:buyer) { create(:user, role: 'review', company: nil, email: 'cliente@example.com') }
  let(:lead) { create(:lead, company: nil, email: buyer.email.upcase) }
  let(:company) { create(:company, status: 'active') }
  let(:distribution) { create(:lead_distribution, lead: lead, company: company, status: 'sent') }

  it 'cria um rascunho visível ao comprador com sua primeira versão' do
    proposal = described_class.new(distribution: distribution).call

    expect(proposal).to have_attributes(
      lead_id: lead.id,
      lead_distribution_id: distribution.id,
      company_id: company.id,
      buyer_user_id: buyer.id,
      status: 'draft',
      current_version_number: 1
    )
    expect(proposal.reference).to eq("AS-#{distribution.created_at.year}-D#{distribution.id.to_s.rjust(8, '0')}")
    expect(proposal.current_version).to have_attributes(
      number: 1,
      status: 'draft',
      title: 'Proposta em preparação'
    )
    expect(proposal.events.last).to have_attributes(event_type: 'proposal.prepared')
  end

  it 'é idempotente e associa o autor quando a empresa inicia a edição' do
    proposal = described_class.new(distribution: distribution).call
    author = create(:user)

    expect do
      result = described_class.new(distribution: distribution, created_by: author).call
      expect(result.id).to eq(proposal.id)
    end.not_to change(MarketplaceProposal, :count)

    expect(proposal.reload.created_by_id).to eq(author.id)
    expect(proposal.versions.count).to eq(1)
  end
end
