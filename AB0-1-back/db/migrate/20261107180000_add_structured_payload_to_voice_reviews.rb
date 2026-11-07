class AddStructuredPayloadToVoiceReviews < ActiveRecord::Migration[7.0]
  def change
    add_column :voice_review_sessions, :draft_payload, :json, null: false, default: {}
    add_column :voice_review_transcripts, :structured_payload, :json, null: false, default: {}
  end
end

