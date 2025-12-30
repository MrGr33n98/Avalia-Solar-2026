class CreateCompanyDailyStats < ActiveRecord::Migration[7.0]
  def change
    create_table :company_daily_stats do |t|
      t.references :company, null: false, foreign_key: true
      t.date :day, null: false
      t.integer :events_count, null: false, default: 0
      t.integer :quote_clicks, null: false, default: 0
      t.integer :whatsapp_clicks, null: false, default: 0
      t.integer :reviews_count, null: false, default: 0
      t.decimal :average_rating, precision: 3, scale: 2, null: false, default: 0
      t.integer :rating_count, null: false, default: 0
      t.timestamps
    end

    add_index :company_daily_stats, [:company_id, :day], unique: true
  end
end
