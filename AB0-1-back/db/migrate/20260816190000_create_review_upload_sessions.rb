class CreateReviewUploadSessions < ActiveRecord::Migration[7.0]
  def change
    create_table :review_upload_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.uuid :uuid, null: false, default: -> { 'gen_random_uuid()' }
      t.string :status, null: false, default: 'active'
      t.datetime :expires_at, null: false
      t.datetime :finalized_at
      t.timestamps
    end

    add_index :review_upload_sessions, :uuid, unique: true
    add_index :review_upload_sessions, %i[user_id status expires_at],
              name: 'idx_review_upload_sessions_availability'
  end
end