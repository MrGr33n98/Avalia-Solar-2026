class AddWhatsappUrlToReviewerProfiles < ActiveRecord::Migration[7.0]
  def change
    add_column :reviewer_profiles, :whatsapp_url, :string, limit: 500 unless column_exists?(:reviewer_profiles, :whatsapp_url)
  end
end
