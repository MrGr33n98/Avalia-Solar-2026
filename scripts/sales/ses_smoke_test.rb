#!/usr/bin/env ruby
# frozen_string_literal: true

abort 'Use RAILS_ENV=staging/production.' unless %w[staging production].include?(ENV.fetch('RAILS_ENV', ''))
abort 'Defina AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY.' if ENV['AWS_ACCESS_KEY_ID'].to_s.empty? || ENV['AWS_SECRET_ACCESS_KEY'].to_s.empty?

require_relative '../../AB0-1-back/config/environment'

message = if ENV['SMOKE_EMAIL_MESSAGE_ID'].to_s != ''
            Sales::EmailMessage.find(ENV.fetch('SMOKE_EMAIL_MESSAGE_ID'))
          else
            user = User.find_by(id: ENV['SMOKE_USER_ID'])
            account = Sales::Account.find(ENV.fetch('SMOKE_ACCOUNT_ID'))
            abort 'SMOKE_USER_ID deve pertencer à empresa da conta.' unless user && user.company_id == account.company_id
            recipient = ENV.fetch('SMOKE_TO_EMAIL')
            contact = account.contacts.find_or_create_by!(email: recipient) { |record| record.first_name = 'SES Smoke' }
            thread = Sales::EmailThread.create!(company_id: account.company_id, sales_account_id: account.id,
                                                sales_contact_id: contact.id, subject_normalized: 'ses smoke',
                                                first_message_at: Time.current, last_message_at: Time.current)
            message = Sales::EmailMessage.create!(company_id: account.company_id, sales_email_thread_id: thread.id,
                                                  sales_account_id: account.id, sales_contact_id: contact.id,
                                                  sender_user_id: user.id, from_email: user.email, to_email: recipient,
                                                  subject: 'Avalia Solar SES smoke test', body_text: 'SES smoke test',
                                                  body_html: '<p>SES smoke test</p>', status: 'queued')
            thread.update!(message_count: 1)
            message
          end
abort "Mensagem #{message.id} não está queued/draft." unless %w[queued draft].include?(message.status)
abort 'Mensagem não pertence a uma conta e contato válidos.' unless message.sales_account_id && message.sales_contact_id

Sales::SendEmailJob.perform_now(message.id)
message.reload
abort "SES não confirmou envio: #{message.metadata['error']}" unless message.status == 'sent' && message.provider_message_id.present?
abort 'Evento sent não foi persistido.' unless message.events.exists?(event_type: 'sent')
abort 'Atividade email_sent não foi persistida.' unless Sales::Activity.exists?(sales_account_id: message.sales_account_id, sales_contact_id: message.sales_contact_id, activity_type: 'email_sent')

puts "SES_SMOKE_OK message=#{message.id} provider_message_id=#{message.provider_message_id}"
