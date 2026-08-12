# frozen_string_literal: true

module Chat
  module SourceProvenance
    TYPES = %w[
      company_catalog company_profile company_review knowledge_registry
      company_health next_best_action platform_policy
    ].freeze

    def self.normalize(metadata)
      data = (metadata || {}).deep_stringify_keys
      sources = Array(data['sources']).filter_map do |source|
        item = source.to_h.deep_stringify_keys
        next unless TYPES.include?(item['type'].to_s)

        { 'type' => item['type'].to_s, 'id' => item['id'] }.compact
      end
      data['sources'] = sources if sources.any?
      data
    end
  end
end
