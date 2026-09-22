# frozen_string_literal: true

class AddSnapshotDateToCompanyRankingSnapshots < ActiveRecord::Migration[7.0]
  INDEX_NAME = 'idx_ranking_snapshots_daily'.freeze
  BUSINESS_TIME_ZONE = 'America/Sao_Paulo'

  def up
    add_column :company_ranking_snapshots, :snapshot_date, :date

    backfill_snapshot_dates
    assert_no_daily_duplicates!

    change_column_null :company_ranking_snapshots, :snapshot_date, false
    add_index :company_ranking_snapshots,
              'company_id, scope_type, COALESCE(scope_id, -1), definition_version, snapshot_date',
              unique: true,
              name: INDEX_NAME
  end

  def down
    remove_index :company_ranking_snapshots, name: INDEX_NAME
    remove_column :company_ranking_snapshots, :snapshot_date
  end

  private

  def backfill_snapshot_dates
    execute <<~SQL.squish
      UPDATE company_ranking_snapshots
      SET snapshot_date = (computed_at AT TIME ZONE '#{BUSINESS_TIME_ZONE}')::date
      WHERE snapshot_date IS NULL
    SQL
  end

  def assert_no_daily_duplicates!
    duplicates = select_all(<<~SQL.squish)
      SELECT company_id, scope_type, scope_id, definition_version, snapshot_date, COUNT(*) AS total
      FROM company_ranking_snapshots
      GROUP BY company_id, scope_type, scope_id, definition_version, snapshot_date
      HAVING COUNT(*) > 1
      LIMIT 1
    SQL
    return if duplicates.empty?

    duplicate = duplicates.first
    raise ActiveRecord::MigrationError,
          "Snapshots diários duplicados detectados (empresa #{duplicate['company_id']}, escopo #{duplicate['scope_type']}, " \
          "data #{duplicate['snapshot_date']}). A migration foi interrompida sem remover histórico; execute o " \
          'preflight de ranking e trate as duplicatas antes de repetir o deploy.'
  end
end
