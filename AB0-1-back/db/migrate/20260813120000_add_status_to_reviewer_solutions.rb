class AddStatusToReviewerSolutions < ActiveRecord::Migration[7.0]
  def change
    add_column :reviewer_solutions, :status, :string, null: false, default: 'active'
    add_index :reviewer_solutions, :status
  end
end
