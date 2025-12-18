class CreateDownloadables < ActiveRecord::Migration[7.0]
  def change
    create_table :downloadables do |t|
      t.string :title
      t.text :description
      t.string :file_url
      t.integer :download_count
      t.integer :article_id

      t.timestamps
    end
  end
end
