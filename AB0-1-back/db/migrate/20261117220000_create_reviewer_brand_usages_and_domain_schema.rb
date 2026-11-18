# frozen_string_literal: true

class CreateReviewerBrandUsagesAndDomainSchema < ActiveRecord::Migration[7.0]
  def change
    create_table :reviewer_brand_usages do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.references :brand, null: false, foreign_key: true, index: true
      t.string :usage_context, limit: 40, null: false
      t.string :source, limit: 32, default: 'manual', null: false
      t.references :source_review, null: true, foreign_key: { to_table: :reviews, on_delete: :nullify }
      t.date :experience_since
      t.text :description
      t.string :visibility, limit: 16, default: 'private', null: false
      t.string :consent_version, limit: 32
      t.datetime :opted_in_at
      t.string :verification_status, limit: 32, default: 'self_declared', null: false
      t.string :status, limit: 16, default: 'active', null: false
      t.integer :lock_version, default: 0, null: false

      t.timestamps
    end

    add_index :reviewer_brand_usages, %i[user_id brand_id usage_context],
              unique: true,
              name: 'uq_reviewer_brand_context'
    add_index :reviewer_brand_usages, %i[user_id status],
              name: 'idx_rbu_user_status'
    add_index :reviewer_brand_usages, %i[brand_id visibility status],
              name: 'idx_rbu_public',
              where: "visibility = 'public' AND status = 'active'"

    create_table :reviewer_brand_usage_events do |t|
      t.references :reviewer_brand_usage, null: false, foreign_key: true, index: true
      t.references :actor, foreign_key: { to_table: :users }, index: true
      t.string :action, null: false
      t.string :old_status
      t.string :new_status
      t.jsonb :metadata, default: {}, null: false
      t.text :notes

      t.timestamps
    end

    add_index :reviewer_brand_usage_events, %i[reviewer_brand_usage_id created_at],
              name: 'idx_rbue_timeline'

    # Extensão expand de reviewer_solutions com referências canônicas opcionais
    add_reference :reviewer_solutions, :brand, null: true, foreign_key: { on_delete: :nullify }
    add_reference :reviewer_solutions, :product, null: true, foreign_key: { on_delete: :nullify }
    add_column :reviewer_solutions, :usage_context, :string, limit: 40, null: true
    add_index :reviewer_solutions, %i[user_id brand_id], name: 'idx_rs_user_brand'
  end
end
