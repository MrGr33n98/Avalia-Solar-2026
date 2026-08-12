# frozen_string_literal: true

module Chat
  module Prompts
    RegistryEntry = Struct.new(:id, :version, :updated_at, keyword_init: true)

    REGISTRY = {
      consumer: RegistryEntry.new(id: 'mobivolt_consumer_v2', version: 'v2', updated_at: '2026-08-12'),
      success: RegistryEntry.new(id: 'mobivolt_success_v4', version: 'v4', updated_at: '2026-08-12')
    }.freeze

    def self.for(vertical)
      REGISTRY[vertical.to_s == 'success' ? :success : :consumer]
    end
  end
end
