class ChangeViewsForUsers < ActiveRecord::Migration[7.0]
  def up
    change_column :users, :views, :integer, default: 0
  end

  def down
    # Reverting to original state (views was likely string or had no default)
    # Based on the migration context, setting back to integer with nil default
    change_column :users, :views, :integer, default: nil
  end
end
