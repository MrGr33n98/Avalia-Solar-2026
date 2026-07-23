# frozen_string_literal: true

class CreateProjectsMaterialsAndIntentData < ActiveRecord::Migration[7.0]
  def change
    create_table :company_projects do |t|
      t.references :company, null: false, foreign_key: true
      t.string :title, null: false
      t.string :slug, null: false
      t.text :summary
      t.string :project_type
      t.string :segment
      t.string :technology
      t.string :city
      t.string :state, limit: 2
      t.decimal :capacity_value, precision: 12, scale: 2
      t.string :capacity_unit, null: false, default: 'kWp'
      t.date :completion_date
      t.string :status, null: false, default: 'draft'
      t.datetime :published_at
      t.integer :position, null: false, default: 0
      t.text :moderation_reason
      t.timestamps
    end
    add_index :company_projects, %i[company_id slug], unique: true
    add_index :company_projects, %i[company_id status published_at], name: 'idx_company_projects_publication'

    create_table :digital_assets do |t|
      t.references :company, null: false, foreign_key: true
      t.references :attachable, polymorphic: true, null: false
      t.string :kind, null: false
      t.string :title
      t.string :alt_text
      t.text :caption
      t.string :external_url
      t.string :provider
      t.string :status, null: false, default: 'pending'
      t.string :processing_status, null: false, default: 'pending'
      t.string :checksum
      t.integer :position, null: false, default: 0
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :digital_assets, %i[attachable_type attachable_id position], name: 'idx_digital_assets_attachable_position'
    add_index :digital_assets, %i[company_id status], name: 'idx_digital_assets_company_status'
    add_index :digital_assets, %i[company_id checksum], where: 'checksum IS NOT NULL', name: 'idx_digital_assets_company_checksum'

    create_table :content_lead_forms do |t|
      t.references :company, null: false, foreign_key: true
      t.string :name, null: false
      t.string :status, null: false, default: 'active'
      t.jsonb :fields, null: false, default: []
      t.text :consent_text
      t.string :privacy_url
      t.integer :version, null: false, default: 1
      t.timestamps
    end
    add_index :content_lead_forms, %i[company_id status]

    create_table :company_materials do |t|
      t.references :company, null: false, foreign_key: true
      t.references :content_lead_form, foreign_key: true
      t.string :title, null: false
      t.string :slug, null: false
      t.text :description
      t.string :material_type, null: false, default: 'catalog'
      t.string :visibility, null: false, default: 'public'
      t.string :gate_mode, null: false, default: 'none'
      t.string :status, null: false, default: 'draft'
      t.datetime :published_at
      t.datetime :expires_at
      t.integer :download_count, null: false, default: 0
      t.integer :version, null: false, default: 1
      t.text :moderation_reason
      t.timestamps
    end
    add_index :company_materials, %i[company_id slug], unique: true
    add_index :company_materials, %i[company_id status published_at], name: 'idx_company_materials_publication'

    create_table :content_leads do |t|
      t.references :company, null: false, foreign_key: true
      t.string :email, null: false
      t.string :email_digest, null: false
      t.string :name
      t.string :phone
      t.string :company_name
      t.jsonb :attributes_data, null: false, default: {}
      t.jsonb :consents, null: false, default: {}
      t.datetime :last_seen_at
      t.timestamps
    end
    add_index :content_leads, %i[company_id email_digest], unique: true

    create_table :material_downloads, id: :uuid do |t|
      t.references :company, null: false, foreign_key: true
      t.references :company_material, null: false, foreign_key: true
      t.references :content_lead, foreign_key: true
      t.references :content_lead_form, foreign_key: true
      t.string :anonymous_id
      t.string :authorization_token_digest, null: false
      t.datetime :authorized_at, null: false
      t.datetime :expires_at, null: false
      t.datetime :delivered_at
      t.string :delivery_status, null: false, default: 'authorized'
      t.string :idempotency_key
      t.string :utm_source
      t.string :utm_medium
      t.string :utm_campaign
      t.string :referrer_host
      t.jsonb :form_submission, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :material_downloads, :authorization_token_digest, unique: true
    add_index :material_downloads, %i[company_material_id delivery_status created_at], name: 'idx_material_downloads_material_status_time'
    add_index :material_downloads, %i[company_id idempotency_key], unique: true, where: 'idempotency_key IS NOT NULL', name: 'idx_material_downloads_idempotency'

    create_table :content_moderation_decisions do |t|
      t.references :company, null: false, foreign_key: true
      t.references :moderatable, polymorphic: true, null: false
      t.references :admin_user, foreign_key: true
      t.string :decision, null: false
      t.text :reason
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :content_moderation_decisions, %i[moderatable_type moderatable_id created_at], name: 'idx_content_moderation_decisions_target'
  end
end
