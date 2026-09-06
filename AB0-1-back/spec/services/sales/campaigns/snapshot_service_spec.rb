# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Campaigns::SnapshotService, type: :service do
  it 'blocks snapshot when audience has no eligible recipients' do
    company = create(:company) rescue Company.create!(name: 'Snapshot Spec', slug: "snapshot-#{SecureRandom.hex(4)}")
    user = create(:user, company: company) rescue User.create!(name: 'Snapshot User', email: "snapshot-#{SecureRandom.hex(4)}@test.com", password: 'Password123!', company_id: company.id)
    template = Sales::EmailTemplate.create!(company: company, user: user, name: 'Snapshot template', subject_template: 'Oi', body_html: '<p>Oi</p>', status: 'draft')
    campaign = Sales::Campaign.create!(company: company, user: user, name: 'Empty audience', campaign_type: 'email_broadcast', email_template: template, status: 'draft', audience_filter: {})

    expect { described_class.call(campaign: campaign) }.to raise_error(described_class::EmptyAudienceError, 'Nenhum destinatário elegível encontrado.')
    expect(campaign.reload.recipients.count).to eq(0)
  end
end
