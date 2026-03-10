class CreateIntentScoreHistories < ActiveRecord::Migration[7.0]
  def change
    create_table :intent_score_histories, id: :uuid do |t|
      t.uuid     :intent_score_id,     null: false
      t.integer  :score_before,        null: false
      t.integer  :score_after,         null: false
      t.string   :level_before,        null: false
      t.string   :level_after,         null: false
      t.string   :change_reason
      t.jsonb    :score_breakdown,     default: {}
      t.string   :triggered_by

      t.timestamps
    end

    add_index :intent_score_histories, :intent_score_id
    add_index :intent_score_histories, :created_at
    add_index :intent_score_histories, [:intent_score_id, :created_at], name: 'idx_histories_score_time'

    add_foreign_key :intent_score_histories, :intent_scores, column: :intent_score_id
  end
end
