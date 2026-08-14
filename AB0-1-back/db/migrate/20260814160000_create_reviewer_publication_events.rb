class CreateReviewerPublicationEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :reviewer_publication_events do |t|
      t.references :reviewer_publication, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.string :event_name, null: false
      t.string :session_id
      t.string :channel
      t.string :referrer
      t.jsonb :metadata, null: false, default: {}
      t.string :ip_address
      t.timestamps
    end
    add_index :reviewer_publication_events, %i[reviewer_publication_id event_name created_at], name: 'idx_publication_events_lookup'
  end
end
