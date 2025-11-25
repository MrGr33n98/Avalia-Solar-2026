class CreateSponsoredPlans < ActiveRecord::Migration[7.0]
  def change
    create_table :sponsored_plans do |t|
      t.integer :member_id
      t.references :product, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.references :plan, null: false, foreign_key: true
      t.string :custom_cta
      t.boolean :active
      t.datetime :purchased_at
      t.datetime :start_at
      t.datetime :end_at

      t.timestamps
    end
  end
end
