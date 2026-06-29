class AddReviewOperationsAndAudit < ActiveRecord::Migration[7.0]
  def change
    add_column :reviews, :reply_deleted_at, :datetime
    add_column :reviews, :moderation_notes, :text
    add_column :reviews, :moderated_at, :datetime
    add_column :reviews, :moderated_by_type, :string
    add_column :reviews, :moderated_by_id, :bigint
    add_column :reviews, :verification_notes, :text
    add_column :reviews, :verified_at, :datetime
    add_column :reviews, :verified_by_type, :string
    add_column :reviews, :verified_by_id, :bigint

    add_index :reviews, %i[moderated_by_type moderated_by_id]
    add_index :reviews, %i[verified_by_type verified_by_id]
    add_index :reviews, :reply_deleted_at

    create_table :review_audit_events do |t|
      t.references :review, null: false, foreign_key: true
      t.string :actor_type
      t.bigint :actor_id
      t.string :event_type, null: false
      t.jsonb :previous_value, null: false, default: {}
      t.jsonb :new_value, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :review_audit_events, %i[actor_type actor_id]
    add_index :review_audit_events, %i[review_id created_at]
    add_index :review_audit_events, :event_type
  end
end
