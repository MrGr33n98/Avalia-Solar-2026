class AddCreatorFieldsToReviewerProfiles < ActiveRecord::Migration[7.0]
  def change
    add_column :reviewer_profiles, :public_slug, :string unless column_exists?(:reviewer_profiles, :public_slug)
    add_column :reviewer_profiles, :creator_enabled, :boolean, null: false, default: false unless column_exists?(:reviewer_profiles, :creator_enabled)
    add_column :reviewer_profiles, :public_headline, :string unless column_exists?(:reviewer_profiles, :public_headline)
    add_column :reviewer_profiles, :public_bio, :text unless column_exists?(:reviewer_profiles, :public_bio)
    add_column :reviewer_profiles, :youtube_url, :string unless column_exists?(:reviewer_profiles, :youtube_url)
    add_column :reviewer_profiles, :public_email_enabled, :boolean, null: false, default: false unless column_exists?(:reviewer_profiles, :public_email_enabled)
    add_column :reviewer_profiles, :lead_capture_enabled, :boolean, null: false, default: true unless column_exists?(:reviewer_profiles, :lead_capture_enabled)
    add_index :reviewer_profiles, :public_slug, unique: true, where: 'public_slug IS NOT NULL' unless index_exists?(:reviewer_profiles, :public_slug)
  end
end
