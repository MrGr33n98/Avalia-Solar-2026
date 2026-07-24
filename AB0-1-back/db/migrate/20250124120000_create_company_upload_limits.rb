class CreateCompanyUploadLimits < ActiveRecord::Migration[7.0]
  def change
    create_table :company_upload_limits do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true }
      t.integer :monthly_limit_mb
      t.integer :images_count, null: false, default: 0
      t.integer :videos_count, null: false, default: 0
      t.integer :projects_count, null: false, default: 0

      t.timestamps
    end

  end
end