class CreateReviewerProfiles < ActiveRecord::Migration[7.0]
  def change
    create_table :reviewer_profiles do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string :profession
      t.string :company_name
      t.text :bio
      t.date :birth_date
      t.string :linkedin_url
      t.string :instagram_url
      t.string :website_url
      t.boolean :public_profile, null: false, default: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
  end
end
