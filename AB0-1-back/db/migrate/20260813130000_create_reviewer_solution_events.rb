class CreateReviewerSolutionEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :reviewer_solution_events do |t|
      t.references :reviewer_solution, null: false, foreign_key: true
      t.references :actor, foreign_key: { to_table: :users }
      t.string :action, null: false
      t.string :old_status
      t.string :new_status
      t.text :notes
      t.timestamps
    end
    add_index :reviewer_solution_events, [:reviewer_solution_id, :created_at], name: 'idx_reviewer_solution_events_timeline'
  end
end
