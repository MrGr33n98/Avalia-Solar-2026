# frozen_string_literal: true

module Sales
  module ContactMethods
    class LegacySync
      def self.sync_contact(contact)
        new(contact).sync
      end

      def initialize(contact)
        @contact = contact
      end

      def sync
        return unless @contact.persisted?

        sync_field('email', @contact.email) if @contact.email.present?
        sync_field('phone', @contact.phone) if @contact.phone.present?
        sync_field('whatsapp', @contact.whatsapp) if @contact.whatsapp.present?
        sync_field('linkedin', @contact.linkedin_url) if @contact.linkedin_url.present?
      end

      private

      def sync_field(kind, value)
        return if value.blank?

        normalized = ::Sales::ContactMethods::Normalize.call(kind: kind, value: value)
        existing = @contact.contact_methods.active.where(kind: kind, normalized_value: normalized).first

        if existing
          unless existing.is_primary?
            ::Sales::ContactMethods::SetPrimary.call(contact_method: existing)
          end
        else
          # Se não existe método com esse valor, cria como primário
          ::Sales::ContactMethods::Upsert.call(
            contact: @contact,
            attributes: {
              kind: kind,
              value: value,
              label: 'Trabalho',
              is_primary: true,
              source: 'migration'
            }
          )
        end
      rescue StandardError => e
        Rails.logger.warn("[Sales::ContactMethods::LegacySync] Falha ao sincronizar #{kind} para contato #{@contact.id}: #{e.message}")
      end
    end
  end
end
