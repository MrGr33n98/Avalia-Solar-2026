class CreateReviewForms < ActiveRecord::Migration[7.0]
  def change
    create_table :review_forms do |t|
      t.references :company, null: false, foreign_key: true
      t.string :name, null: false
      t.string :public_title, null: false
      t.text :public_description
      t.string :form_type, null: false, default: 'general'
      t.string :slug, null: false
      t.string :token, null: false
      t.string :status, null: false, default: 'active'
      t.boolean :is_default, null: false, default: false
      t.jsonb :settings, null: false, default: {}
      t.timestamps
    end

    add_index :review_forms, :token, unique: true
    add_index :review_forms, %i[company_id slug], unique: true
    add_index :review_forms, %i[company_id status]

    create_table :review_form_events do |t|
      t.references :company, null: false, foreign_key: true
      t.references :review_form, null: false, foreign_key: true
      t.string :event_type, null: false
      t.string :source, null: false, default: 'link'
      t.string :ip_hash
      t.string :referrer
      t.string :user_agent
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :review_form_events, %i[review_form_id event_type created_at], name: 'idx_review_form_events_type_time'

    change_column_null :reviews, :user_id, true
    add_reference :reviews, :review_form, foreign_key: true
    add_column :reviews, :form_answers, :jsonb, null: false, default: {}
    add_column :reviews, :verification_status, :string, null: false, default: 'pending'
    add_index :reviews, %i[review_form_id created_at]
  end
end
