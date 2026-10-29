# frozen_string_literal: true

module Sales
  module ContactMethods
    class Upsert
      class DuplicateError < StandardError; end

      def self.call(contact:, attributes:, actor: nil, method_id: nil)
        new(contact: contact, attributes: attributes, actor: actor, method_id: method_id).call
      end

      def initialize(contact:, attributes:, actor: nil, method_id: nil)
        @contact = contact
        attrs = attributes.respond_to?(:to_unsafe_h) ? attributes.to_unsafe_h : (attributes.respond_to?(:to_h) ? attributes.to_h : attributes)
        @attributes = attrs.with_indifferent_access
        @actor = actor
        @method_id = method_id
      end

      def call
        @contact.with_lock do
          method = find_or_initialize_method
          kind = (@attributes[:kind] || method.kind).to_s.downcase.strip
          value = (@attributes[:value] || method.value).to_s.strip
          label = @attributes.key?(:label) ? @attributes[:label].to_s.strip : (method.label || 'Trabalho')
          is_primary = @attributes.key?(:is_primary) ? ActiveModel::Type::Boolean.new.cast(@attributes[:is_primary]) : method.is_primary
          position = @attributes.key?(:position) ? @attributes[:position].to_i : method.position
          source = @attributes[:source] || method.source || 'manual'

          normalized = ::Sales::ContactMethods::Normalize.call(kind: kind, value: value)

          # Verificar duplicidade ativa no mesmo contato
          existing_duplicate = @contact.contact_methods
                                       .active
                                       .where(kind: kind, normalized_value: normalized)
                                       .where.not(id: method.id)
                                       .first

          if existing_duplicate
            raise DuplicateError, "Já existe um #{kind} cadastrado com o valor '#{value}' para este contato."
          end

          # Se for o primeiro método ativo deste tipo, vira principal automaticamente
          has_active_same_kind = @contact.contact_methods
                                         .active
                                         .where(kind: kind)
                                         .where.not(id: method.id)
                                         .exists?

          should_be_primary = is_primary || !has_active_same_kind

          method.assign_attributes(
            kind: kind,
            value: value,
            normalized_value: normalized,
            label: label.presence || 'Trabalho',
            position: position,
            source: source,
            updated_by: @actor,
            company_id: @contact.account&.company_id
          )
          method.created_by = @actor if method.new_record?

          method.save!

          if should_be_primary
            ::Sales::ContactMethods::SetPrimary.call(contact_method: method, actor: @actor)
          end

          method.reload
        end
      end

      private

      def find_or_initialize_method
        if @method_id.present?
          @contact.contact_methods.find(@method_id)
        else
          @contact.contact_methods.build
        end
      end
    end
  end
end
