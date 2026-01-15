class CreateCompanyVideos < ActiveRecord::Migration[7.0]
  def change
    create_table :company_videos do |t|
      t.references :company, null: false, foreign_key: true
      t.string :url, null: false
      t.string :provider, null: false, default: 'youtube'
      t.string :video_id, null: false
      t.string :title
      t.string :thumbnail_url
      t.string :status, null: false, default: 'pending'
      t.integer :position
      t.timestamps
    end

    add_index :company_videos, [:company_id, :status]
    add_index :company_videos, :video_id
  end
end

