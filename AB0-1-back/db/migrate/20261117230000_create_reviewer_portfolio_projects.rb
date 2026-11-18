# frozen_string_literal: true

class CreateReviewerPortfolioProjects < ActiveRecord::Migration[7.0]
  def change
    create_table :reviewer_portfolio_projects do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string :title, null: false, limit: 160
      t.string :project_type, null: false, limit: 32
      t.string :city, limit: 100
      t.string :state, limit: 2
      t.date :started_at
      t.date :completed_at
      t.decimal :capacity_kwp, precision: 12, scale: 3
      t.string :visibility, null: false, default: 'private', limit: 20
      t.string :consent_version, limit: 50
      t.datetime :opted_in_at
      t.string :verification_status, null: false, default: 'self_declared', limit: 30
      t.string :status, null: false, default: 'active', limit: 20
      t.text :description
      t.integer :lock_version, null: false, default: 0

      t.timestamps
    end

    add_index :reviewer_portfolio_projects, %i[user_id status]
    add_index :reviewer_portfolio_projects, %i[user_id created_at]
    add_index :reviewer_portfolio_projects, :visibility

    create_table :reviewer_portfolio_project_brands do |t|
      t.references :reviewer_portfolio_project, null: false, foreign_key: true, index: { name: 'idx_port_proj_brands_on_proj_id' }
      t.references :reviewer_brand_usage, null: false, foreign_key: true, index: { name: 'idx_port_proj_brands_on_usage_id' }

      t.timestamps
    end

    add_index :reviewer_portfolio_project_brands,
              %i[reviewer_portfolio_project_id reviewer_brand_usage_id],
              unique: true,
              name: 'idx_uniq_port_proj_brand'

    create_table :reviewer_portfolio_project_events do |t|
      t.references :reviewer_portfolio_project, null: false, foreign_key: true, index: { name: 'idx_port_proj_events_on_proj_id' }
      t.references :actor, null: false, foreign_key: { to_table: :users }, index: true
      t.string :action, null: false, limit: 40
      t.string :old_status, limit: 30
      t.string :new_status, limit: 30
      t.jsonb :metadata, null: false, default: {}

      t.datetime :created_at, null: false
    end

    add_index :reviewer_portfolio_project_events, %i[reviewer_portfolio_project_id created_at],
              name: 'idx_port_proj_events_created_at'
  end
end
