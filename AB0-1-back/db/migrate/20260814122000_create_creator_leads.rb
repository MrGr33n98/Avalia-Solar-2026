class CreateCreatorLeads < ActiveRecord::Migration[7.0]
  def change
    create_table :creator_leads do |t|
      t.references :creator_user, null: false, foreign_key: { to_table: :users }
      t.references :publication, foreign_key: { to_table: :reviewer_publications }
      t.references :visitor, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.string :email, null: false
      t.string :phone
      t.text :message
      t.string :intent, null: false, default: 'contact_creator'
      t.string :source
      t.string :utm_source
      t.string :utm_medium
      t.string :utm_campaign
      t.datetime :consent_at, null: false
      t.string :ip_address
      t.string :user_agent
      t.timestamps
    end
    add_index :creator_leads, %i[creator_user_id created_at]
  end
end
