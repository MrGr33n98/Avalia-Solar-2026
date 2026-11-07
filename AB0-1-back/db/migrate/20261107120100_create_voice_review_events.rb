class CreateVoiceReviewEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :voice_review_events, id: :string, limit: 36 do |t|
      t.references :voice_review_session, foreign_key: { to_table: :voice_review_sessions }, type: :string
      t.references :voice_review_invite, foreign_key: { to_table: :voice_review_invites }, type: :string
      t.references :company, null: false, foreign_key: true
      t.string :event_name, null: false
      t.integer :event_version, null: false, default: 1
      t.string :dedupe_key, null: false
      t.json :safe_properties, null: false, default: {}
      t.datetime :occurred_at, null: false
      t.timestamps
    end
    add_index :voice_review_events, :dedupe_key, unique: true
    add_index :voice_review_events, %i[company_id occurred_at]
  end
end
