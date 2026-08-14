class AddCreatorFieldsToReviewerProfiles < ActiveRecord::Migration[7.0]
  def change
    add_column :reviewer_profiles, :public_slug, :string
    add_column :reviewer_profiles, :creator_enabled, :boolean, null: false, default: false
    add_column :reviewer_profiles, :public_headline, :string
    add_column :reviewer_profiles, :public_bio, :text
    add_column :reviewer_profiles, :website_url, :string
    add_column :reviewer_profiles, :linkedin_url, :string
    add_column :reviewer_profiles, :instagram_url, :string
    add_column :reviewer_profiles, :youtube_url, :string
    add_column :reviewer_profiles, :public_email_enabled, :boolean, null: false, default: false
    add_column :reviewer_profiles, :lead_capture_enabled, :boolean, null: false, default: true
    add_index :reviewer_profiles, :public_slug, unique: true, where: 'public_slug IS NOT NULL'
  end
end
