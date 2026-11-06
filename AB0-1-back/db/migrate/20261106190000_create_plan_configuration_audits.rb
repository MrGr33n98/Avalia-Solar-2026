class CreatePlanConfigurationAudits < ActiveRecord::Migration[7.0]
  def change
    create_table :plan_configuration_audits do |t|
      t.references :plan, null: true, foreign_key: { on_delete: :nullify }
      t.references :admin_user, null: true, foreign_key: { on_delete: :nullify }
      t.json :before_state, null: false, default: {}
      t.json :after_state, null: false, default: {}
      t.string :change_reason, limit: 300
      t.timestamps
    end
    add_index :plan_configuration_audits, :created_at
  end
end
