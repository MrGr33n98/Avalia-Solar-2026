class CreateSalesCRM < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_accounts do |t|
      t.references :company, foreign_key: true, index: false
      t.references :owner, null: false, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.string :domain
      t.string :website
      t.string :phone
      t.string :email
      t.string :city
      t.string :state
      t.string :country, null: false, default: 'BR'
      t.string :segment
      t.string :company_size
      t.string :source
      t.string :source_detail
      t.string :status, null: false, default: 'prospecting'
      t.jsonb :metadata, null: false, default: {}
      t.datetime :last_activity_at
      t.timestamps
    end
    add_index :sales_accounts, :domain
    add_index :sales_accounts, :status
    add_index :sales_accounts, %i[company_id], unique: true, where: 'company_id IS NOT NULL'

    create_table :sales_pipelines do |t|
      t.string :name, null: false
      t.string :key, null: false
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :sales_pipelines, :key, unique: true

    create_table :sales_stages do |t|
      t.references :sales_pipeline, null: false, foreign_key: true
      t.string :name, null: false
      t.string :key, null: false
      t.integer :position, null: false
      t.integer :probability, null: false, default: 0
      t.string :terminal_type
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :sales_stages, %i[sales_pipeline_id key], unique: true
    add_index :sales_stages, %i[sales_pipeline_id position], unique: true

    create_table :sales_contacts do |t|
      t.references :sales_account, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.string :first_name, null: false
      t.string :last_name
      t.string :email
      t.string :phone
      t.string :whatsapp
      t.string :job_title
      t.string :linkedin_url
      t.string :decision_role
      t.boolean :is_primary, null: false, default: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :sales_contacts, :email

    create_table :sales_opportunities do |t|
      t.references :sales_account, null: false, foreign_key: true
      t.references :primary_contact, foreign_key: { to_table: :sales_contacts }
      t.references :sales_pipeline, null: false, foreign_key: true
      t.references :sales_stage, null: false, foreign_key: true
      t.references :owner, null: false, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.bigint :value_cents, null: false, default: 0
      t.string :currency, null: false, default: 'BRL'
      t.integer :probability, null: false, default: 0
      t.boolean :probability_overridden, null: false, default: false
      t.string :priority, null: false, default: 'medium'
      t.string :source
      t.string :status, null: false, default: 'open'
      t.date :expected_close_date
      t.datetime :next_activity_at
      t.datetime :last_activity_at
      t.datetime :stage_entered_at
      t.datetime :won_at
      t.datetime :lost_at
      t.string :lost_reason
      t.text :lost_notes
      t.jsonb :metadata, null: false, default: {}
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end
    add_index :sales_opportunities, :status
    add_index :sales_opportunities, :next_activity_at

    create_table :sales_stage_histories do |t|
      t.references :sales_opportunity, null: false, foreign_key: true, index: false
      t.references :from_stage, foreign_key: { to_table: :sales_stages }
      t.references :to_stage, null: false, foreign_key: { to_table: :sales_stages }
      t.references :actor, foreign_key: { to_table: :users }
      t.datetime :entered_at, null: false
      t.datetime :left_at
      t.integer :duration_seconds
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :sales_activities do |t|
      t.references :sales_account, null: false, foreign_key: true
      t.references :sales_opportunity, foreign_key: true
      t.references :sales_contact, foreign_key: true
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.string :activity_type, null: false
      t.string :direction
      t.string :subject
      t.text :body
      t.datetime :occurred_at, null: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :sales_tasks do |t|
      t.references :sales_account, null: false, foreign_key: true
      t.references :sales_opportunity, foreign_key: true
      t.references :sales_contact, foreign_key: true
      t.references :owner, null: false, foreign_key: { to_table: :users }
      t.string :task_type, null: false
      t.string :title, null: false
      t.text :description
      t.string :status, null: false, default: 'pending'
      t.string :priority, null: false, default: 'medium'
      t.datetime :due_at
      t.datetime :completed_at
      t.timestamps
    end

    create_table :sales_qualifications do |t|
      t.references :sales_opportunity, null: false, foreign_key: true, index: false
      t.text :situation, :problem, :implication, :need_payoff, :budget, :authority, :need, :timeline
      t.integer :spin_completion, null: false, default: 0
      t.integer :bant_completion, null: false, default: 0
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :sales_qualifications, :sales_opportunity_id, unique: true
  end
end
