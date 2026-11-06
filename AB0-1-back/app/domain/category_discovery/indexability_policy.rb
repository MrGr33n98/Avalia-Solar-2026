module CategoryDiscovery
  class IndexabilityPolicy
    VALID_SLUG_REGEX = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/
    MAX_SLUG_LENGTH = 160
    MIN_SUBSTANTIVE_DESCRIPTION_LENGTH = 70

    class << self
      def evaluate(category, enforced: default_enforced?)
        mode = enforced ? :enforced : :shadow

        if category.nil?
          return IndexabilityDecision.new(
            publicly_accessible: false,
            indexable: false,
            include_in_sitemap: false,
            robots_directive: 'noindex,nofollow',
            reason_codes: [:not_found],
            mode: mode
          )
        end

        unless category.status.to_s == 'active'
          return IndexabilityDecision.new(
            publicly_accessible: false,
            indexable: false,
            include_in_sitemap: false,
            robots_directive: 'noindex,nofollow',
            reason_codes: [:inactive],
            mode: mode
          )
        end

        slug = normalize_slug(category.try(:seo_url))
        unless valid_slug?(slug)
          return IndexabilityDecision.new(
            publicly_accessible: false,
            indexable: false,
            include_in_sitemap: false,
            robots_directive: 'noindex,nofollow',
            reason_codes: [:invalid_slug],
            mode: mode
          )
        end

        canonical_path = "/categories/#{slug}"
        warnings = collect_advisory_warnings(category)

        if mode == :enforced && warnings.include?(:empty_without_editorial_utility)
          return IndexabilityDecision.new(
            publicly_accessible: true,
            indexable: false,
            include_in_sitemap: false,
            robots_directive: 'noindex,follow',
            canonical_slug: slug,
            canonical_path: canonical_path,
            reason_codes: [:empty_without_editorial_utility],
            advisory_warnings: warnings,
            mode: mode
          )
        end

        reason_codes = warnings.any? ? [:legacy_active_fallback] : [:eligible]

        IndexabilityDecision.new(
          publicly_accessible: true,
          indexable: true,
          include_in_sitemap: true,
          robots_directive: 'index,follow',
          canonical_slug: slug,
          canonical_path: canonical_path,
          reason_codes: reason_codes,
          advisory_warnings: warnings,
          mode: mode
        )
      end

      def default_enforced?
        ENV.fetch('CATEGORY_INDEXABILITY_GATE_ENFORCED', 'false') == 'true'
      end

      def valid_slug?(slug)
        slug.present? && slug.length <= MAX_SLUG_LENGTH && slug.match?(VALID_SLUG_REGEX)
      end

      private

      def normalize_slug(raw_slug)
        raw_slug.to_s.strip.downcase
      end

      def collect_advisory_warnings(category)
        warnings = []

        if category.respond_to?(:editorial_status) && category.editorial_status.to_s == 'draft'
          warnings << :unpublished_editorial_draft
        end

        substantive_copy = substantive_editorial_copy?(category)
        warnings << :thin_editorial_copy unless substantive_copy

        unless inventory_or_editorial_utility?(category, substantive_copy: substantive_copy)
          warnings << :empty_without_editorial_utility
        end

        warnings
      end

      def substantive_editorial_copy?(category)
        name = category.try(:name).to_s.strip.downcase
        candidates = [
          category.try(:description),
          category.try(:short_description),
          category.try(:seo_description)
        ].compact.map { |text| sanitize_text(text) }

        candidates.any? do |text|
          text.length >= MIN_SUBSTANTIVE_DESCRIPTION_LENGTH && text.downcase != name
        end
      end

      def inventory_or_editorial_utility?(category, substantive_copy:)
        return true if substantive_copy
        return true if category.try(:companies_count).to_i.positive?
        return true if category.try(:products_count).to_i.positive?

        if category.respond_to?(:association) &&
           category.association(:category_faqs).loaded? &&
           category.category_faqs.any? { |f| f.status == 'published' }
          return true
        end

        if category.respond_to?(:association) &&
           category.association(:category_solution_types).loaded? &&
           category.category_solution_types.any?(&:active)
          return true
        end

        false
      end

      def sanitize_text(value)
        ActionView::Base.full_sanitizer.sanitize(value.to_s).squish
      end
    end
  end
end

