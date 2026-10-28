# frozen_string_literal: true

module Sales
  module ContactMethods
    class Archive
      def self.call(contact_method:, actor: nil, replacement_id: nil)
        new(contact_method: contact_method, actor: actor, replacement_id: replacement_id).call
      end

      def initialize(contact_method:, actor: nil, replacement_id: nil)
        @contact_method = contact_method
        @contact = contact_method.contact
        @actor = actor
        @replacement_id = replacement_id
      end

      def call
        @contact.with_lock do
          was_primary = @contact_method.is_primary?
          kind = @contact_method.kind

          # Arquivar logicamente
          @contact_method.update!(
            archived_at: Time.current,
            is_primary: false,
            updated_by: @actor
          )

          if was_primary
            # Buscar substituto
            replacement = if @replacement_id.present?
                            @contact.contact_methods.active.by_kind(kind).find_by(id: @replacement_id)
                          else
                            @contact.contact_methods.active.by_kind(kind).order(position: :asc, created_at: :asc).first
                          end

            if replacement
              ::Sales::ContactMethods::SetPrimary.call(contact_method: replacement, actor: @actor)
            else
              clear_legacy_column!(kind)
            end
          end
        end

        @contact_method
      end

      private

      def clear_legacy_column!(kind)
        case kind
        when 'email'
          @contact.update_columns(email: nil, updated_at: Time.current)
        when 'phone'
          @contact.update_columns(phone: nil, updated_at: Time.current)
        when 'whatsapp'
          @contact.update_columns(whatsapp: nil, updated_at: Time.current)
        when 'linkedin'
          @contact.update_columns(linkedin_url: nil, updated_at: Time.current)
        end
      end
    end
  end
end
