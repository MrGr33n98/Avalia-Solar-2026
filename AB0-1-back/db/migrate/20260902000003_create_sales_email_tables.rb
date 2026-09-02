class CreateSalesEmailTables < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_email_messages do |t|
      t.references :sales_account, null: false, foreign_key: true
      t.references :sales_contact, null: false, foreign_key: true
      t.references :sales_opportunity, foreign_key: true
      t.references :sender_user, null: false, foreign_key: { to_table: :users }
      t.string :provider, null: false, default: 'aws_ses'
      t.string :provider_message_id
      t.string :from_email, null: false
      t.string :to_email, null: false
      t.string :cc
      t.string :bcc
      t.string :subject, null: false
      t.text :body_text
      t.text :body_html
      t.string :status, null: false, default: 'queued'
      t.datetime :sent_at
      t.datetime :delivered_at
      t.datetime :bounced_at
      t.datetime :first_opened_at
      t.datetime :last_opened_at
      t.integer :open_count, null: false, default: 0
      t.datetime :first_clicked_at
      t.datetime :last_clicked_at
      t.integer :click_count, null: false, default: 0
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :sales_email_messages, :provider_message_id
    add_index :sales_email_messages, :status
    add_index :sales_email_messages, :sent_at

    create_table :sales_email_events do |t|
      t.references :sales_email_message, null: false, foreign_key: true
      t.string :provider_event_id
      t.string :event_type, null: false
      t.string :url
      t.string :user_agent
      t.datetime :occurred_at, null: false
      t.jsonb :payload, null: false, default: {}
      t.timestamps
    end

    add_index :sales_email_events, :provider_event_id, unique: true, where: 'provider_event_id IS NOT NULL'
    add_index :sales_email_events, %i[sales_email_message_id event_type], name: 'idx_sales_email_events_msg_event'

    create_table :sales_message_templates do |t|
      t.string :name, null: false
      t.string :channel, null: false, default: 'email'
      t.string :subject
      t.text :body, null: false
      t.string :category, null: false, default: 'first_contact'
      t.boolean :active, null: false, default: true
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :sales_message_templates, %i[channel category]
  end
end
