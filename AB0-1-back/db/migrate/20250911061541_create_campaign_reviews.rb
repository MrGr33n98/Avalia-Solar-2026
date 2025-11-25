class CreateCampaignReviews < ActiveRecord::Migration[7.0]
  def change
    create_table :campaign_reviews do |t|
      t.references :product, null: false, foreign_key: true
      t.string :title
      t.string :code
      t.integer :member_id
      t.string :share_code
      t.integer :goal
      t.integer :achieved
      t.integer :debutants
      t.integer :shares
      t.string :prize
      t.datetime :start_at
      t.datetime :end_at

      t.timestamps
    end
  end
end
