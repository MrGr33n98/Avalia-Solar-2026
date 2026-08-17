class CreateReviewMedia < ActiveRecord::Migration[7.0]
  def change
    create_table :review_media do |t|
      t.references :review, foreign_key: true
      t.references :upload_session, null: false, foreign_key: { to_table: :review_upload_sessions }
      t.references :user, null: false, foreign_key: true
      t.string :media_type, null: false, default: 'image'
      t.string :status, null: false, default: 'pending'
      t.integer :sort_order, null: false, default: 0
      t.string :content_type
      t.bigint :byte_size
      t.integer :width
      t.integer :height
      t.string :moderation_status, null: false, default: 'pending'
      t.text :rejected_reason
      t.string :moderated_by_type
      t.bigint :moderated_by_id
      t.datetime :moderated_at
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :review_media, %i[review_id sort_order]
    add_index :review_media, :status
    add_index :review_media, :moderation_status
    add_index :review_media, %i[moderated_by_type moderated_by_id]
  end
end