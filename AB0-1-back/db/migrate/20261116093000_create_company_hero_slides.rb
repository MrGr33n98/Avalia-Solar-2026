# frozen_string_literal: true

class CreateCompanyHeroSlides < ActiveRecord::Migration[7.0]
  def change
    create_table :company_hero_slides do |t|
      t.references :company, null: false, foreign_key: true
      t.integer :slot, null: false
      t.integer :display_position, null: false
      t.integer :revision, null: false, default: 1
      t.string :status, null: false, default: 'draft'
      t.string :alt_text, limit: 160
      t.integer :image_width
      t.integer :image_height
      t.bigint :image_bytes
      t.string :image_format
      t.bigint :created_by_id
      t.bigint :reviewed_by_id
      t.datetime :approved_at
      t.datetime :published_at
      t.datetime :archived_at
      t.string :rejection_reason
      t.bigint :replaces_slide_id
      t.string :request_key, limit: 80
      t.string :source, null: false, default: 'dashboard'
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end

    add_check_constraint :company_hero_slides, 'slot BETWEEN 1 AND 3',
                         name: 'company_hero_slide_slot_1_to_3'
    add_check_constraint :company_hero_slides, 'display_position BETWEEN 1 AND 3',
                         name: 'company_hero_slide_position_1_to_3'
    add_check_constraint :company_hero_slides, 'revision >= 1',
                         name: 'company_hero_slide_revision_positive'
    add_check_constraint :company_hero_slides,
                         "status IN ('draft','pending_review','approved','published','rejected','archived')",
                         name: 'company_hero_slide_status_valid'
    add_index :company_hero_slides, %i[company_id slot revision],
              unique: true, name: 'idx_company_hero_slides_unique_revision'
    add_index :company_hero_slides, %i[company_id slot],
              unique: true, where: "status = 'published'",
              name: 'idx_company_hero_slides_unique_published_slot'
    add_index :company_hero_slides, %i[company_id request_key], unique: true,
              name: 'idx_company_hero_slides_idempotency', where: 'request_key IS NOT NULL'
    add_index :company_hero_slides, %i[company_id status display_position],
              name: 'idx_company_hero_slides_public_order'
  end
end
