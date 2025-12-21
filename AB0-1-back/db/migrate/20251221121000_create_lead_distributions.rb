class CreateLeadDistributions < ActiveRecord::Migration[7.0]
  def change
    create_table :lead_distributions do |t|
      t.references :lead, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.string :status, default: 'queued'
      t.datetime :assigned_at
      t.jsonb :payload

      t.timestamps
    end
  end
end
