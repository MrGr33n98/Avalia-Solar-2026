# frozen_string_literal: true

module Ranking
  # Adapter para leitura unificada e compatível entre snapshots legados (CompanyRankingSnapshot)
  # e as execuções canônicas imutáveis (RankingRun).
  # Garante retrocompatibilidade total de leitura sem migração destrutiva.
  class SnapshotReader
    attr_reader :source

    def initialize(source)
      @source = source
    end

    def self.wrap(source)
      new(source)
    end

    def legacy_format?
      @source.is_a?(CompanyRankingSnapshot) || (@source.is_a?(Hash) && !@source.key?(:manifest_release) && !@source.key?('manifest_release'))
    end

    def run_id
      if legacy_format?
        id_val = @source.respond_to?(:id) ? @source.id : @source[:id] || @source['id']
        "legacy-snapshot-#{id_val || 'unpersisted'}"
      else
        @source.respond_to?(:run_id) ? @source.run_id : (@source[:run_id] || @source['run_id'])
      end
    end

    def manifest_version
      if legacy_format?
        @source.respond_to?(:definition_version) ? @source.definition_version : (@source[:definition_version] || @source['definition_version'] || 'organic-performance-v2')
      else
        @source.respond_to?(:manifest) ? @source.manifest.release_identifier : (@source[:manifest_release] || @source['manifest_release'])
      end
    end

    def as_of
      if legacy_format?
        date_val = @source.respond_to?(:snapshot_date) ? @source.snapshot_date : (@source[:snapshot_date] || @source['snapshot_date'])
        date_val.is_a?(String) ? Time.zone.parse(date_val) : date_val&.to_time
      else
        @source.respond_to?(:as_of) ? @source.as_of : (@source[:as_of] || @source['as_of'])
      end
    end

    def computed_at
      if legacy_format?
        @source.respond_to?(:computed_at) ? @source.computed_at : (@source[:computed_at] || @source['computed_at'])
      else
        @source.respond_to?(:computed_at) ? @source.computed_at : (@source[:computed_at] || @source['computed_at'])
      end
    end

    def score
      val = @source.respond_to?(:score) ? @source.score : (@source[:score] || @source['score'])
      val.to_f
    end

    def rank_position
      val = @source.respond_to?(:rank_position) ? @source.rank_position : (@source[:rank_position] || @source['rank_position'])
      val.to_i
    end

    def population_size
      val = @source.respond_to?(:population_size) ? @source.population_size : (@source[:population_size] || @source['population_size'])
      val.to_i
    end

    def percentile
      val = @source.respond_to?(:percentile) ? @source.percentile : (@source[:percentile] || @source['percentile'])
      val.to_f
    end

    def to_canonical_payload
      {
        run_id: run_id,
        manifest_release: manifest_version,
        as_of: as_of&.iso8601,
        computed_at: computed_at&.iso8601,
        score: score,
        rank_position: rank_position,
        population_size: population_size,
        percentile: percentile,
        legacy_format: legacy_format?
      }
    end
  end
end
