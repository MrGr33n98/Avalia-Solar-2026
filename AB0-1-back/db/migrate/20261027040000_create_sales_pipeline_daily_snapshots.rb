# frozen_string_literal: true

class CreateSalesPipelineDailySnapshots < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_pipeline_daily_snapshots do |t|
      t.references :sales_pipeline, null: false, foreign_key: { to_table: :sales_pipelines }
      t.references :company, foreign_key: { to_table: :companies }
      t.references :owner, foreign_key: { to_table: :users }
      t.references :source, foreign_key: { to_table: :sales_sources }
      t.date :snapshot_date, null: false
      t.datetime :captured_at, null: false
      t.integer :open_count, null: false, default: 0
      t.bigint :open_value_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.integer :definition_version, null: false, default: 1

      t.timestamps
    end

    add_index :sales_pipeline_daily_snapshots,
              [:sales_pipeline_id, :snapshot_date],
              name: 'idx_pipe_snapshots_on_pipeline_and_date'

    add_index :sales_pipeline_daily_snapshots,
              [:company_id, :snapshot_date],
              name: 'idx_pipe_snapshots_on_company_and_date'

    # Índice canônico único para garantir idempotência absoluta (compatível com Postgres 14+)
    reversible do |dir|
      dir.up do
        execute <<~SQL
          CREATE UNIQUE INDEX idx_pipeline_snapshots_canonical_unique
          ON sales_pipeline_daily_snapshots (
            sales_pipeline_id,
            COALESCE(company_id, 0),
            COALESCE(owner_id, 0),
            COALESCE(source_id, 0),
            snapshot_date
          );
        SQL
      end

      dir.down do
        execute <<~SQL
          DROP INDEX IF EXISTS idx_pipeline_snapshots_canonical_unique;
        SQL
      end
    end
  end
end
