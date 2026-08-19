class CreateFeedItems < ActiveRecord::Migration[7.0]
  def change
    create_table :feed_items do |t|
      t.references :actor, polymorphic: true, null: false
      t.references :subject, polymorphic: true, null: false
      t.string :verb, null: false
      t.string :visibility, null: false, default: 'public'
      t.datetime :published_at, null: false
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :feed_items, :published_at
    add_index :feed_items, [:actor_type, :actor_id]
    add_index :feed_items, [:subject_type, :subject_id]
    add_index :feed_items, :verb
    add_index :feed_items, :visibility
  end
end
