# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LeadRoutingJob, type: :job do
  it 'não distribui uma solicitação sem OTP confirmado' do
    lead = create(
      :lead,
      company: nil,
      product_vertical: 'Energia Solar',
      project_profile: 'Residencial',
      quote_type: 'Energia Solar',
      system_size_band: 'Até 7 kWp',
      decision_timeline: 'Agora',
      address_full: 'Rua Solar, 10',
      consent_at: Time.current,
      wizard_status: 'pending_otp',
      otp_verified_at: nil
    )

    expect { described_class.perform_now(lead.id) }.not_to change(MarketplaceProposal, :count)
    expect(lead.reload.wizard_status).to eq('pending_otp')
  end

  it 'cria a proposta em preparação ao distribuir a solicitação' do
    lead = create(
      :lead,
      company: nil,
      product_vertical: 'Energia Solar',
      project_profile: 'Residencial',
      quote_type: 'Energia Solar',
      system_size_band: 'Até 7 kWp',
      decision_timeline: 'Agora',
      address_full: 'Rua Solar, 10',
      consent_at: Time.current,
      wizard_status: 'verified',
      otp_verified_at: Time.current
    )
    company = create(:company, status: 'active')
    allow(Leads::LeadMatchingService).to receive(:call).and_return(
      [{ company: company, match_score: 90, match_reasons: { region: true } }]
    )
    allow(Analytics::TrackEventService).to receive(:call)

    expect { described_class.perform_now(lead.id) }
      .to change(MarketplaceProposal, :count).by(1)

    distribution = lead.lead_distributions.find_by!(company: company)
    expect(distribution.marketplace_proposal).to have_attributes(status: 'draft', current_version_number: 1)
    expect(lead.reload.wizard_status).to eq('distributed')
  end
end
