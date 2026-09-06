# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::CampaignBatchProcessorJob, type: :job do
  it 'uses frozen template snapshot instead of mutable template' do
    company = create(:company) rescue Company.create!(name: 'Batch Spec', slug: "batch-#{SecureRandom.hex(4)}")
    user = create(:user, company: company) rescue User.create!(name: 'Batch User', email: "batch-#{SecureRandom.hex(4)}@test.com", password: 'Password123!', company_id: company.id)
    account = Sales::Account.create!(company: company, owner: user, name: 'Batch Account')
    contact = Sales::Contact.create!(account: account, first_name: 'Maria', email: "maria-#{SecureRandom.hex(4)}@solar.test")
    template = Sales::EmailTemplate.create!(company: company, user: user, name: 'Mutable', subject_template: 'Novo assunto', body_html: '<p>Novo</p>', status: 'draft')
    campaign = Sales::Campaign.create!(company: company, user: user, email_template: template, name: 'Batch campaign', campaign_type: 'email_broadcast', status: 'dispatching', template_snapshot: { 'template_id' => template.id, 'subject_template' => 'Assunto congelado', 'body_html' => '<p>Congelado</p>', 'body_json' => {} }, template_snapshot_at: Time.current)
    recipient = Sales::CampaignRecipient.create!(company: company, campaign: campaign, contact: contact, account: account, email: contact.email, first_name: contact.first_name, status: 'pending')
    allow(Sales::SendEmailJob).to receive(:perform_now) { |id| Sales::EmailMessage.find(id).update!(status: 'sent', sent_at: Time.current) }

    described_class.perform_now(campaign.id, [recipient.id])

    message = Sales::EmailMessage.find_by(sales_campaign_recipient_id: recipient.id)
    expect(message.subject).to eq('Assunto congelado')
    expect(message.body_html).to eq('<p>Congelado</p>')
  end
end
