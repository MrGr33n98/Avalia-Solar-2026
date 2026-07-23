# frozen_string_literal: true

# Immutable daily read model for the organic performance ranking.  It deliberately
# does not contain sponsored placement: paid placement belongs to search/ad units.
class CreateCompanyRankingSnapshots < ActiveRecord::Migration[7.0]
  def change
    json_type = ActiveRecord::Base.connection.adapter_name =~ /postgre/i ? :jsonb : :json

    create_table :company_ranking_snapshots do |t|
      t.references :company, null: false, foreign_key: true
      t.string :scope_type, null: false, default: 'global'
      t.bigint :scope_id
      t.string :definition_version, null: false
      t.decimal :score, precision: 10, scale: 4, null: false
      t.integer :rank_position, null: false
      t.integer :population_size, null: false
      t.decimal :percentile, precision: 5, scale: 2, null: false
      t.column :breakdown, json_type, null: false, default: {}
      t.column :quality_flags, json_type, null: false, default: []
      t.datetime :data_through, null: false
      t.datetime :computed_at, null: false
      t.timestamps
    end

    add_index :company_ranking_snapshots,
              [:company_id, :scope_type, :scope_id, :computed_at],
              name: 'idx_ranking_snapshots_company_scope_time'
    add_index :company_ranking_snapshots,
              [:scope_type, :scope_id, :definition_version, :computed_at, :rank_position],
              name: 'idx_ranking_snapshots_leaderboard'
  end
end
