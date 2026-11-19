# frozen_string_literal: true

require 'yaml'

# Public badge definitions are catalog data, not demo content. Production CD
# runs db:migrate but does not necessarily run db:seed.
class BackfillReviewerAchievementCatalog < ActiveRecord::Migration[7.0]
  class BadgeRecord < ActiveRecord::Base
    self.table_name = 'achievement_badges'
  end

  ATTRIBUTES = %w[
    name description category tier points_xp metric_key threshold
    action_enum earned_asset_path locked_asset_path position active revocable
  ].freeze

  def up
    return if Rails.env.test?
    return unless table_exists?(:achievement_badges)

    catalog = Rails.root.join('db', 'seeds', 'achievements.yml')
    raise "Achievement catalog not found: #{catalog}" unless catalog.file?

    items = YAML.safe_load_file(catalog)
    raise 'Invalid achievements catalog' unless items.is_a?(Array)

    BadgeRecord.reset_column_information

    # Do not overwrite live or manually curated badge records.
    # Unique slug makes the operation safe to retry.
    items.each do |entry|
      slug = entry.fetch('slug')
      badge = BadgeRecord.find_or_initialize_by(slug: slug)
      next unless badge.new_record?

      badge.assign_attributes(entry.slice(*ATTRIBUTES))
      badge.save!
    end
  end

  def down
    # Intentionally preserve catalog records: user_achievements and ledger
    # entries may reference them, so deleting them is unsafe.
  end
end
