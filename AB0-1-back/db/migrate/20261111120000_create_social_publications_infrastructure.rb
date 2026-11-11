# frozen_string_literal: true

class CreateSocialPublicationsInfrastructure < ActiveRecord::Migration[7.0]
  def change
    create_table :social_content_items do |t|
      t.string :source_type, null: false, default: 'article'
      t.bigint :source_id
      t.string :title, null: false
      t.string :slug
      t.string :category
      t.string :content_hash, null: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :social_content_items, :content_hash, unique: true, name: 'idx_social_content_items_hash'
    add_index :social_content_items, %i[source_type source_id], name: 'idx_social_content_items_source'

    create_table :social_media_assets do |t|
      t.references :social_content_item, foreign_key: true, null: false
      t.string :asset_type, null: false, default: 'feed_image'
      t.string :render_url, null: false
      t.string :storage_path
      t.integer :width, null: false, default: 1080
      t.integer :height, null: false, default: 1350
      t.string :content_type, default: 'image/png'
      t.jsonb :dimensions_metadata, default: {}
      t.timestamps
    end

    add_index :social_media_assets, :asset_type, name: 'idx_social_media_assets_type'

    create_table :social_publications do |t|
      t.references :social_content_item, foreign_key: true, null: false
      t.string :platform, null: false, default: 'instagram'
      t.string :account_handle, null: false, default: 'avalia_solar'
      t.string :state, null: false, default: 'draft'
      t.text :caption, null: false
      t.string :meta_container_id
      t.string :meta_media_id
      t.string :permalink
      t.string :approval_token_digest
      t.string :approved_by
      t.datetime :approved_at
      t.datetime :published_at
      t.text :error_message
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :social_publications, :state, name: 'idx_social_publications_state'
    add_index :social_publications, :meta_media_id, name: 'idx_social_publications_media_id'
    add_index :social_publications, :permalink, name: 'idx_social_publications_permalink'

    create_table :social_publication_events do |t|
      t.references :social_publication, foreign_key: true, null: false
      t.string :event_type, null: false
      t.string :state_from
      t.string :state_to
      t.jsonb :payload, default: {}
      t.timestamps
    end

    add_index :social_publication_events, :event_type, name: 'idx_social_pub_events_type'
  end
end
