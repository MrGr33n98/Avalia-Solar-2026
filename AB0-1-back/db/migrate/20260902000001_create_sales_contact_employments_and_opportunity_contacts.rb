class CreateSalesContactEmploymentsAndOpportunityContacts < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_contact_employments do |t|
      t.references :sales_contact, null: false, foreign_key: true
      t.references :sales_account, null: false, foreign_key: true
      t.string :job_title
      t.string :department
      t.string :seniority
      t.string :relationship_type, null: false, default: 'employee'
      t.boolean :is_current, null: false, default: true
      t.boolean :is_primary, null: false, default: true
      t.datetime :started_at
      t.datetime :ended_at
      t.string :source
      t.string :source_url
      t.float :confidence
      t.datetime :verified_at
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :sales_contact_employments, %i[sales_contact_id sales_account_id],
              name: 'idx_sales_contact_employments_contact_account'
    add_index :sales_contact_employments, :is_current
    add_index :sales_contact_employments, :is_primary

    create_table :sales_opportunity_contacts do |t|
      t.references :sales_opportunity, null: false, foreign_key: true
      t.references :sales_contact, null: false, foreign_key: true
      t.string :role, null: false, default: 'decision_maker'
      t.string :influence, null: false, default: 'medium'
      t.string :support_level, null: false, default: 'neutral'
      t.boolean :is_primary, null: false, default: false
      t.text :notes
      t.timestamps
    end

    add_index :sales_opportunity_contacts, %i[sales_opportunity_id sales_contact_id],
              unique: true, name: 'index_sales_opp_contacts_unique'
  end
end
