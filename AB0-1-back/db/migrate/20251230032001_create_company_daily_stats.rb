# frozen_string_literal: true

class CreateCompanyDailyStats < ActiveRecord::Migration[7.0]
  def change
    create_table :company_daily_stats do |t|
      t.integer :company_id, null: false
      t.date :day, null: false

      t.integer :profile_views, null: false, default: 0
      t.integer :cta_clicks, null: false, default: 0
      t.integer :whatsapp_clicks, null: false, default: 0
      t.integer :leads, null: false, default: 0
      t.integer :reviews, null: false, default: 0

      t.timestamps
    end

    add_index :company_daily_stats, %i[company_id day], unique: true
    add_index :company_daily_stats, :day
  end
end
