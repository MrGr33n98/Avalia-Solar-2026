# frozen_string_literal: true

class CreateAchievementsSchema < ActiveRecord::Migration[7.0]
  def change
    create_table :achievement_badges do |t|
      t.string :slug, null: false
      t.string :name, null: false
      t.text :description, null: false
      t.string :category, null: false, default: 'community'
      t.string :tier, null: false, default: 'bronze'
      t.integer :points_xp, null: false, default: 0
      t.string :metric_key, null: false
      t.integer :threshold, null: false, default: 1
      t.string :action_enum, null: false, default: 'view'
      t.string :earned_asset_path, null: false
      t.string :locked_asset_path, null: false
      t.integer :position, null: false, default: 0
      t.boolean :active, null: false, default: true
      t.boolean :revocable, null: false, default: false

      t.timestamps
    end

    add_index :achievement_badges, :slug, unique: true
    add_index :achievement_badges, %i[active position]

    create_table :user_achievements do |t|
      t.references :user, null: false, foreign_key: true
      t.references :achievement_badge, null: false, foreign_key: true
      t.string :state, null: false, default: 'unlocked'
      t.datetime :unlocked_at, null: false
      t.datetime :revoked_at
      t.string :share_token, null: false
      t.integer :lock_version, null: false, default: 0

      t.timestamps
    end

    add_index :user_achievements, %i[user_id achievement_badge_id], unique: true
    add_index :user_achievements, :share_token, unique: true
    add_index :user_achievements, %i[user_id state]

    create_table :achievement_ledger do |t|
      t.references :user, null: false, foreign_key: true
      t.references :achievement_badge, null: false, foreign_key: true
      t.string :kind, null: false
      t.integer :xp_delta, null: false
      t.string :idempotency_key, null: false
      t.bigint :admin_user_id
      t.text :reason

      t.timestamps
    end

    add_index :achievement_ledger, :idempotency_key, unique: true
    add_index :achievement_ledger, %i[user_id created_at]
    add_foreign_key :achievement_ledger, :admin_users, column: :admin_user_id
  end
end
