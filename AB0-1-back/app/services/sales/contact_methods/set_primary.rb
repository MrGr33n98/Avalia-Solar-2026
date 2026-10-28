# frozen_string_literal: true

module Sales
  module ContactMethods
    class SetPrimary
      def self.call(contact_method:, actor: nil)
        new(contact_method: contact_method, actor: actor).call
      end

      def initialize(contact_method:, actor: nil)
        @contact_method = contact_method
        @contact = contact_method.contact
        @actor = actor
      end

      def call
        raise ArgumentError, 'Método arquivado não pode ser principal' if @contact_method.archived_at.present?

        @contact.with_lock do
          # Desmarcar outros métodos ativos do mesmo tipo como principal
          @contact.contact_methods
                  .active
                  .by_kind(@contact_method.kind)
                  .where.not(id: @contact_method.id)
                  .update_all(is_primary: false, updated_at: Time.current)

          # Marcar este método como principal
          @contact_method.update!(is_primary: true, updated_by: @actor)

          # Espelhar coluna legada em sales_contacts
          sync_legacy_column!
        end

        @contact_method
      end

      private

      def sync_legacy_column!
        case @contact_method.kind
        when 'email'
          @contact.update_columns(email: @contact_method.value, updated_at: Time.current)
        when 'phone'
          @contact.update_columns(phone: @contact_method.value, updated_at: Time.current)
        when 'whatsapp'
          @contact.update_columns(whatsapp: @contact_method.value, updated_at: Time.current)
        when 'linkedin'
          @contact.update_columns(linkedin_url: @contact_method.value, updated_at: Time.current)
        end
      end
    end
  end
end
