require 'rails_helper'

RSpec.describe Marketplace::ProposalDecisionService, type: :service do
  it 'aceita uma proposta, cria projeto e encerra as concorrentes' do
    buyer = create(:user)
    lead = create(:lead, email: buyer.email)
    first_distribution = create(:lead_distribution, lead: lead)
    second_distribution = create(:lead_distribution, lead: lead)
    first = create(:marketplace_proposal, lead: lead, lead_distribution: first_distribution, buyer_user: buyer,
                                          status: 'sent')
    second = create(:marketplace_proposal, lead: lead, lead_distribution: second_distribution, buyer_user: buyer,
                                           status: 'sent')

    described_class.new(proposal: first, buyer: buyer, kind: 'accepted').call

    expect(first.reload.status).to eq('accepted')
    expect(first.project).to be_present
    expect(second.reload.status).to eq('not_selected')
    expect(first.project.milestones.count).to eq(6)
  end
end
