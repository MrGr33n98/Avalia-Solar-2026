module CategoryDiscovery
  class IndexabilityDecision
    attr_reader :publicly_accessible,
                :indexable,
                :include_in_sitemap,
                :robots_directive,
                :canonical_slug,
                :canonical_path,
                :reason_codes,
                :advisory_warnings,
                :mode

    def initialize(
      publicly_accessible:,
      indexable:,
      include_in_sitemap:,
      robots_directive:,
      canonical_slug: nil,
      canonical_path: nil,
      reason_codes: [],
      advisory_warnings: [],
      mode: :shadow
    )
      @publicly_accessible = Boolean(publicly_accessible)
      @indexable = Boolean(indexable)
      @include_in_sitemap = Boolean(include_in_sitemap)
      @robots_directive = robots_directive.to_s.freeze
      @canonical_slug = canonical_slug&.to_s&.freeze
      @canonical_path = canonical_path&.to_s&.freeze
      @reason_codes = Array(reason_codes).map(&:to_sym).uniq.freeze
      @advisory_warnings = Array(advisory_warnings).map(&:to_sym).uniq.freeze
      @mode = mode.to_sym
      freeze
    end

    def publicly_accessible?
      @publicly_accessible
    end

    def indexable?
      @indexable
    end

    def include_in_sitemap?
      @include_in_sitemap
    end

    def to_h
      {
        publicly_accessible: @publicly_accessible,
        indexable: @indexable,
        include_in_sitemap: @include_in_sitemap,
        robots_directive: @robots_directive,
        canonical_slug: @canonical_slug,
        canonical_path: @canonical_path,
        reason_codes: @reason_codes.map(&:to_s),
        advisory_warnings: @advisory_warnings.map(&:to_s),
        mode: @mode.to_s
      }
    end

    def as_json(_options = nil)
      to_h.transform_keys(&:to_s)
    end

    private

    def Boolean(value)
      value ? true : false
    end
  end
end

