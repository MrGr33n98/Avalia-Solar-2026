# frozen_string_literal: true

module Sales
  # Feature-flagged, metadata-only bridge from the official WAHA inbox to the
  # internal Sales CRM. Never writes raw WhatsApp content or customer reviews.
  class WhatsappIngestionJob < ApplicationJob
    queue_as :default
    retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3

    ALERTS = {
      'pricing_requested' => ['Interesse em planos recebido pelo WhatsApp',
                              'Contato perguntou sobre planos ou preços; verificar necessidade e elegibilidade.'],
      'human_requested' => ['Atendimento humano solicitado pelo WhatsApp',
                            'A pessoa solicitou atendimento; encaminhar à equipe responsável.'],
      'company_claim_requested' => ['Solicitação de reivindicação pelo WhatsApp',
                                    'Acompanhar a validação de titularidade; não liberar acesso antecipadamente.']
    }.freeze

    def self.enabled?
      ENV.fetch('WHATSAPP_CRM_ENABLED', 'false') == 'true' &&
        ENV['WHATSAPP_CRM_TENANT_COMPANY_ID'].to_s.match?(/\A[1-9]\d*\z/)
    end

    def self.normalized_phone(contact)
      raw = contact.to_s.strip
      return nil unless raw.match?(/\A\+?\d{10,15}(?:@c\.us|@s\.whatsapp\.net)?\z/)

      digits = raw.split('@').first.delete_prefix('+')
      digits = "55#{digits}" if digits.length.in?([10, 11])
      return nil unless digits.start_with?('55') && digits.length.in?([12, 13])

      "+#{digits}"
    end

    def self.encrypt_contact(phone)
      encryptor.encrypt_and_sign(phone)
    end

    def self.decrypt_contact(ciphertext)
      encryptor.decrypt_and_verify(ciphertext)
    end

    def self.encryptor
      key = Rails.application.key_generator.generate_key('sales-whatsapp-crm-contact-v1', 32)
      ActiveSupport::MessageEncryptor.new(key)
    end

    def self.contact_hash(phone)
      key = Rails.application.key_generator.generate_key('sales-whatsapp-crm-hmac-v1', 32)
      OpenSSL::HMAC.hexdigest('SHA256', key, phone)
    end

    def self.enqueue_for(record:, message:)
      return unless enabled?
      return unless record.provider == 'waha' && record.voice_review_session_id.blank?
      return unless message['type'].to_s == 'text'

      intent = Whatsapp::CRMSignalClassifier.call(message['text'])
      return unless intent

      phone = normalized_phone(message['from'])
      return unless phone

      perform_later(record.id, intent, encrypt_contact(phone))
    end

    def perform(record_id, intent, encrypted_phone)
      return unless self.class.enabled?
      return unless Whatsapp::CRMSignalClassifier::INTENTS.include?(intent)

      tenant = Company.find_by(id: ENV['WHATSAPP_CRM_TENANT_COMPANY_ID'].to_i)
      return unless tenant

      source = VoiceReviewMessage.find_by(id: record_id, provider: 'waha')
      return unless source && source.processed_at.present? && source.voice_review_session_id.blank?

      phone = self.class.decrypt_contact(encrypted_phone)
      contact_hash = self.class.contact_hash(phone)
      thread = Sales::WhatsappThread.create_or_find_by!(
        company: tenant, provider: source.provider,
        provider_session: source.provider_session.to_s, contact_hash: contact_hash
      )

      thread.with_lock do
        unless thread.messages.exists?(provider_message_id: source.provider_message_id)
          linked_contact = resolve_contact(tenant, phone)
          if linked_contact && thread.sales_contact_id.blank?
            thread.update!(contact: linked_contact, account: linked_contact.account)
          end

          occurred_at = message_time(source.payload_minimal.to_h['timestamp'])
          msg = thread.messages.create!(
            provider_message_id: source.provider_message_id,
            direction: 'inbound',
            message_type: source.message_type,
            intent: intent,
            occurred_at: occurred_at
          )
          thread.update!(last_intent: intent, last_message_at: [thread.last_message_at, occurred_at].compact.max)
          record_alert!(tenant, thread, msg, intent)
          Outbox.record!(
            event_type: 'sales.whatsapp.message_received', aggregate: thread,
            company_id: tenant.id,
            payload: { whatsapp_thread_id: thread.id, whatsapp_message_id: msg.id,
                       intent: intent, source: 'waha', event_version: 1 }
          )
        end
      end
    end

    private

    def resolve_contact(tenant, phone)
      methods = Sales::ContactMethod.active.joins(contact: :account)
                                  .where(kind: 'whatsapp', normalized_value: phone)
                                  .where(sales_accounts: { company_id: tenant.id })
                                  .limit(2).to_a
      return nil unless methods.one?

      contact = methods.first.contact
      return nil unless contact.account && contact.account.company_id == tenant.id

      contact
    end

    def message_time(value)
      stamp = Integer(value, exception: false)
      stamp = stamp / 1_000 if stamp && stamp > 10_000_000_000
      time = stamp ? Time.zone.at(stamp) : Time.current
      time.between?(30.days.ago, 1.day.from_now) ? time : Time.current
    end

    def record_alert!(tenant, thread, msg, intent)
      config = ALERTS[intent]
      return unless config

      Sales::FounderInboxItem.upsert_open!(
        company: tenant,
        dedupe_key: "whatsapp:#{thread.id}:#{intent}",
        attributes: {
          account: thread.account,
          kind: 'whatsapp_attention',
          title: config[0],
          why: config[1],
          recommended_action: intent == 'human_requested' ? 'Atribuir atendimento humano.' :
                              'Revisar contexto e preparar próxima ação comercial.',
          evidence: [{ type: 'sales_whatsapp_message', id: msg.id, intent: intent }],
          risk_tier: 'r1',
          approval_required: false,
          observed_at: msg.occurred_at
        }
      )
    end
  end
end
