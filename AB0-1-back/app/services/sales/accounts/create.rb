# frozen_string_literal: true

module Sales
  module Accounts
    class Create
      ATTRIBUTES = %i[
        name domain website phone email city state segment company_size source source_detail status
      ].freeze

      def self.call(actor:, attributes:)
        new(actor:, attributes:).call
      end

      def initialize(actor:, attributes:)
        @actor = actor
        @attributes = attributes.to_h.symbolize_keys.slice(*ATTRIBUTES)
      end

      def call
        raise ArgumentError, 'O responsável pela conta é obrigatório.' if @actor.blank?

        account = ::Sales::Account.where(owner: @actor).find_or_initialize_by(name: @attributes.fetch(:name))
        account.assign_attributes(@attributes)
        account.owner = @actor
        account.company_id = @actor.company_id
        account.save!
        account
      end
    end
  end
end
