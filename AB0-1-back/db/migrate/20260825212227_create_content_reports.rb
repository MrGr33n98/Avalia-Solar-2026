class CreateContentReports < ActiveRecord::Migration[7.0]
  def change
    create_table :content_reports do |t|
      t.references :reportable, polymorphic: true, null: false
      t.references :reporter, null: false, foreign_key: { to_table: :users }
      t.references :group, null: true, foreign_key: true
      t.string :reason, null: false
      t.string :status, null: false, default: 'open'
      t.references :resolved_by, null: true, foreign_key: { to_table: :users }
      t.datetime :resolved_at
      t.text :details

      t.timestamps
    end
  end
end
