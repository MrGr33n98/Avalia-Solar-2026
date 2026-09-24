# frozen_string_literal: true

module Ranking
  class CompatibilityEngine
    attr_reader :manifest

    def initialize(manifest: MethodologyManifest.organic_v2)
      @manifest = manifest
    end

    def calculate_score(features = {})
      f = features.transform_keys(&:to_sym)

      trust = (f[:trust_score] || 0.0).to_f
      projects = (f[:delivered_projects_score] || 0.0).to_f
      sla = (f[:response_time_sla_score] || 0.0).to_f
      warranty = (f[:warranty_score] || 0.0).to_f

      # Weights from frozen Organic v2 manifest
      w_trust = @manifest.component('trust_score')[:weight]
      w_projects = @manifest.component('delivered_projects')[:weight]
      w_sla = @manifest.component('response_sla')[:weight]
      w_warranty = @manifest.component('warranty_years')[:weight]

      raw_score = (trust * w_trust) + (projects * w_projects) + (sla * w_sla) + (warranty * w_warranty)
      (raw_score * 100).round(2)
    end

    def rank_population(companies_with_features = [])
      scored = companies_with_features.map do |item|
        score = calculate_score(item[:features])
        item.merge(organic_score: score)
      end

      # Deterministic sorting: highest score first, ties broken by id ascending
      sorted = scored.sort_by { |item| [-item[:organic_score], item[:id] || 0] }

      sorted.each_with_index.map do |item, idx|
        item.merge(position: idx + 1, total_population: sorted.size)
      end
    end
  end
end
