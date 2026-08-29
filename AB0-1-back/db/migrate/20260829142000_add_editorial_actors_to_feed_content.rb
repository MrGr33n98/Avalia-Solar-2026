class AddEditorialActorsToFeedContent < ActiveRecord::Migration[7.0]
  def change
    %i[news_items polls].each do |table|
      add_reference table, :actor, polymorphic: true, null: true
      add_column table, :status, :string, null: false, default: 'draft'
    end
    add_index :news_items, :status
    add_check_constraint :news_items, "status IN ('draft', 'published', 'archived')", name: 'news_items_status_valid'
    add_check_constraint :polls, "status IN ('draft', 'published', 'closed')", name: 'polls_status_valid'
  end
end
