class AddWahaProviderFieldsToVoiceReviews < ActiveRecord::Migration[7.0]
  def change
    add_column :voice_review_sessions, :provider_session, :string
    add_column :voice_review_sessions, :provider_chat_id, :string
    add_column :voice_review_assets, :provider_media_url, :text

    remove_index :voice_review_messages, name: 'idx_voice_messages_provider_id'
    add_index :voice_review_messages, %i[provider provider_session provider_message_id], unique: true,
              name: 'idx_voice_messages_provider_session_id'
    add_index :voice_review_sessions, %i[provider provider_session provider_chat_id],
              name: 'idx_voice_sessions_provider_chat'
  end
end
