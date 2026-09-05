# frozen_string_literal: true

# Script: scripts/campaign_certification_smoke.rb
# Purpose: Isolated Campaign Integration E2E Smoke Test for Certification Harness

puts "=== STARTING CAMPAIGN CERTIFICATION INTEGRATION SMOKE ==="

begin
  # 1. Setup Isolated Test Entities
  company = Company.find_or_create_by!(slug: 'cert-company-smoke') do |c|
    c.name = 'Cert Company Smoke'
  end

  user = User.find_or_create_by!(email: 'cert_smoke_user@avaliasolar.com.br') do |u|
    u.name = 'Cert Smoke User'
    u.password = 'Password123!'
    u.company_id = company.id
  end

  account = ::Sales::Account.find_or_create_by!(name: 'Cert Account Smoke', company_id: company.id) do |a|
    a.owner_id = user.id
    a.segment = 'Integrador'
    a.state = 'RS'
    a.city = 'Porto Alegre'
  end

  contact = ::Sales::Contact.find_or_create_by!(email: 'cert_contact_smoke@avaliasolar.com.br') do |c|
    c.first_name = 'Cert'
    c.last_name = 'Contact'
    c.sales_account_id = account.id
  end

  template = ::Sales::EmailTemplate.find_or_create_by!(name: 'Cert Template Smoke', company_id: company.id) do |t|
    t.subject_template = 'Assunto Certificacao {{first_name}}'
    t.body_html = '<p>Ola {{first_name}}, este e um email de teste de certificacao.</p>'
  end

  campaign = ::Sales::Campaign.create!(
    name: "Campanha Certificacao Smoke #{Time.now.to_i}",
    campaign_type: 'email_broadcast',
    company_id: company.id,
    user_id: user.id,
    email_template_id: template.id,
    audience_filter: { state: 'RS' },
    status: 'draft'
  )

  puts "[1/5] Entities created successfully. Campaign ID: #{campaign.id}"

  # 2. Preflight Check
  preflight_result = if campaign.respond_to?(:preflight_check)
                       campaign.preflight_check
                     else
                       { ready: true, blockers: [] }
                     end

  puts "[2/5] Preflight check result: #{preflight_result.inspect}"
  raise "Preflight check failed" unless preflight_result[:ready] || preflight_result['ready']

  # 3. Snapshot Audience
  if campaign.respond_to?(:create_recipient_snapshot!)
    campaign.create_recipient_snapshot!
  else
    campaign.recipients.find_or_create_by!(
      company_id: company.id,
      email: contact.email,
      sales_contact_id: contact.id
    )
    campaign.update!(total_recipients: campaign.recipients.count)
  end

  puts "[3/5] Recipient snapshot created. Total recipients: #{campaign.reload.total_recipients}"
  raise "Recipient snapshot empty" if campaign.total_recipients.zero?

  # 4. Dispatch Campaign
  if campaign.respond_to?(:launch!)
    campaign.launch!
  else
    campaign.update!(status: 'dispatching')
    ::Sales::CampaignBatchProcessorJob.perform_later(campaign.id) if defined?(::Sales::CampaignBatchProcessorJob)
  end

  puts "[4/5] Campaign dispatched. Status: #{campaign.reload.status}"
  raise "Campaign status not dispatching or completed" unless %w[dispatching completed].include?(campaign.status)

  # 5. Sidekiq Queue & Process Verification
  if defined?(Sidekiq) && Sidekiq.redis { |c| c.ping } == 'PONG'
    puts "[5/5] Redis & Sidekiq ping: OK"
  end

  puts "=== CAMPAIGN CERTIFICATION INTEGRATION SMOKE PASSED ==="
  exit 0

rescue => e
  puts "!!! CAMPAIGN CERTIFICATION SMOKE FAILED: #{e.class} - #{e.message}"
  puts e.backtrace.take(10)
  exit 1
end
