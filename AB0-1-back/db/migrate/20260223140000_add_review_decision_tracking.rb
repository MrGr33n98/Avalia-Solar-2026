class AddReviewDecisionTracking < ActiveRecord::Migration[7.0]
  def change
    unless column_exists?(:reviews, :lock_version)
      add_column :reviews, :lock_version, :integer, default: 0, null: false
    end

    create_table :review_decision_logs do |t|
      t.references :review, null: false, foreign_key: true
      t.references :admin_user, null: false, foreign_key: true
      t.string :action, null: false
      t.string :previous_status
      t.string :new_status
      t.text :notes
      t.timestamps
    end
  end
end
