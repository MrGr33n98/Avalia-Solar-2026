# frozen_string_literal: true

class CreateSalesPipelineStageAutomations < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_pipeline_stage_automations do |t|
      t.references :sales_stage, null: false, foreign_key: { to_table: :sales_stages }, index: { name: 'idx_stage_automations_on_stage' }
      t.references :sales_email_sequence, null: false, foreign_key: { to_table: :sales_email_sequences }, index: { name: 'idx_stage_automations_on_seq' }
      t.references :company, null: false, foreign_key: true, index: { name: 'idx_stage_automations_on_company' }
      t.boolean :active, default: true, null: false
      t.string :trigger_type, default: 'on_enter', null: false

      t.timestamps
    end

    add_index :sales_pipeline_stage_automations,
              %i[sales_stage_id sales_email_sequence_id company_id],
              unique: true,
              name: 'idx_sales_stage_automations_unique_rule'
  end
end
