# frozen_string_literal: true

namespace :category_editorial do
  desc 'Idempotent backfill of CategoryEditorialRevision baseline snapshots without overwriting existing SEO content'
  task backfill_baseline: :environment do
    created = 0
    skipped = 0

    Category.find_each do |category|
      if CategoryEditorialRevision.exists?(category_id: category.id)
        skipped += 1
        next
      end

      CategoryEditorialRevision.capture_from_category!(
        category: category,
        status: 'published',
        change_reason: 'Initial backfill snapshot (CDSI-076)'
      )
      created += 1
    end

    puts "[category_editorial:backfill_baseline] created=#{created} skipped=#{skipped}"
  end
end
