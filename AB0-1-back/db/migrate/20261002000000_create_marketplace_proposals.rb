class CreateMarketplaceProposals < ActiveRecord::Migration[7.0]
  def change
    create_table :marketplace_proposals do |t|
      t.references :lead, null: false, foreign_key: true
      t.references :lead_distribution, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.references :buyer_user, foreign_key: { to_table: :users }
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :reference, null: false
      t.string :status, null: false, default: 'draft'
      t.string :currency, null: false, default: 'BRL'
      t.integer :total_cents, null: false, default: 0
      t.datetime :expires_at
      t.datetime :published_at
      t.datetime :viewed_at
      t.datetime :accepted_at
      t.datetime :declined_at
      t.datetime :withdrawn_at
      t.integer :current_version_number, null: false, default: 0
      t.timestamps
    end
    add_index :marketplace_proposals, :reference, unique: true
    add_index :marketplace_proposals, %i[lead_id company_id], unique: true
    add_index :marketplace_proposals, %i[buyer_user_id status]

    create_table :marketplace_proposal_versions do |t|
      t.references :proposal, null: false, foreign_key: { to_table: :marketplace_proposals }
      t.integer :number, null: false
      t.string :status, null: false, default: 'draft'
      t.string :title, null: false
      t.text :summary
      t.integer :total_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.date :valid_until
      t.datetime :published_at
      t.timestamps
    end
    add_index :marketplace_proposal_versions, %i[proposal_id number], unique: true

    create_table :marketplace_proposal_items do |t|
      t.references :version, null: false, foreign_key: { to_table: :marketplace_proposal_versions }
      t.string :kind, null: false, default: 'service'
      t.string :name, null: false
      t.text :description
      t.decimal :quantity, precision: 12, scale: 3, null: false, default: 1
      t.string :unit, null: false, default: 'un'
      t.integer :unit_price_cents, null: false, default: 0
      t.integer :total_cents, null: false, default: 0
      t.integer :position, null: false, default: 0
      t.timestamps
    end

    create_table :marketplace_proposal_terms do |t|
      t.references :version, null: false, foreign_key: { to_table: :marketplace_proposal_versions }
      t.string :key, null: false
      t.string :label, null: false
      t.text :value, null: false
      t.integer :position, null: false, default: 0
      t.timestamps
    end

    create_table :marketplace_proposal_events do |t|
      t.references :proposal, null: false, foreign_key: { to_table: :marketplace_proposals }
      t.references :actor, foreign_key: { to_table: :users }
      t.string :event_type, null: false
      t.jsonb :metadata, null: false, default: {}
      t.datetime :occurred_at, null: false
      t.timestamps
    end
    add_index :marketplace_proposal_events, %i[proposal_id occurred_at], name: 'idx_marketplace_events_proposal_time'

    create_table :marketplace_proposal_decisions do |t|
      t.references :proposal, null: false, foreign_key: { to_table: :marketplace_proposals }
      t.references :buyer_user, foreign_key: { to_table: :users }
      t.string :kind, null: false
      t.text :reason
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :marketplace_proposal_meetings do |t|
      t.references :proposal, null: false, foreign_key: { to_table: :marketplace_proposals }
      t.references :buyer_user, foreign_key: { to_table: :users }
      t.references :company, null: false, foreign_key: true
      t.string :meeting_type, null: false, default: 'video'
      t.string :status, null: false, default: 'requested'
      t.datetime :scheduled_at
      t.text :notes
      t.timestamps
    end

    create_table :marketplace_projects do |t|
      t.references :proposal, null: false, foreign_key: { to_table: :marketplace_proposals }, index: { unique: true }
      t.references :lead, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.references :buyer_user, foreign_key: { to_table: :users }
      t.string :status, null: false, default: 'not_started'
      t.datetime :started_at
      t.datetime :completed_at
      t.timestamps
    end

    create_table :marketplace_project_milestones do |t|
      t.references :project, null: false, foreign_key: { to_table: :marketplace_projects }
      t.string :key, null: false
      t.string :title, null: false
      t.string :status, null: false, default: 'pending'
      t.integer :position, null: false, default: 0
      t.datetime :scheduled_at
      t.datetime :completed_at
      t.text :notes
      t.timestamps
    end
    add_index :marketplace_project_milestones, %i[project_id key], unique: true
  end
end
