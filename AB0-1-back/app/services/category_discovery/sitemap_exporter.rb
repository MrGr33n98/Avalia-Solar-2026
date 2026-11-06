module CategoryDiscovery
  class SitemapExporter
    DEFAULT_LIMIT = 200
    MAX_LIMIT = 500

    class << self
      def call(cursor: nil, limit: DEFAULT_LIMIT, enforced: IndexabilityPolicy.default_enforced?)
        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        page_limit = normalize_limit(limit)
        after_id = normalize_cursor(cursor)

        scope = ::Category.active.order(id: :asc)
        scope = scope.where('categories.id > ?', after_id) if after_id

        rows = scope.preload(:category_faqs, :category_solution_types)
                    .limit(page_limit + 1)
                    .to_a

        has_more = rows.size > page_limit
        batch = rows.first(page_limit)
        next_cursor = has_more ? batch.last&.id : nil

        entries = batch.filter_map do |category|
          decision = IndexabilityPolicy.evaluate(category, enforced: enforced)
          next unless decision.include_in_sitemap?

          lastmod_iso = category.content_last_modified_at&.utc&.iso8601
          {
            id: category.id,
            name: category.name,
            slug: decision.canonical_slug,
            seo_url: decision.canonical_slug,
            canonical_path: decision.canonical_path,
            status: category.status,
            companies_count: category.companies_count.to_i,
            include_in_sitemap: true,
            lastmod: lastmod_iso,
            updated_at: lastmod_iso
          }
        end

        duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(2)

        {
          data: entries,
          meta: {
            next_cursor: next_cursor,
            has_more: has_more,
            count: entries.size,
            limit: page_limit,
            duration_ms: duration_ms
          }
        }
      end

      private

      def normalize_limit(raw_limit)
        parsed = raw_limit.to_i
        parsed = DEFAULT_LIMIT if parsed <= 0
        [[parsed, 1].max, MAX_LIMIT].min
      end

      def normalize_cursor(raw_cursor)
        parsed = raw_cursor.to_i
        parsed.positive? ? parsed : nil
      end
    end
  end
end

