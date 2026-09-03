# frozen_string_literal: true

class CreateSalesLeadsExtensions < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_opportunities, :temperature, :string, default: 'cold', null: false unless column_exists?(:sales_opportunities, :temperature)

    create_table :sales_sources, if_not_exists: true do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.boolean :active, default: true, null: false
      t.timestamps
    end

    add_index :sales_sources, :slug, unique: true, if_not_exists: true

    add_reference :sales_opportunities, :source, foreign_key: { to_table: :sales_sources } unless column_exists?(:sales_opportunities, :source_id)

    create_table :sales_competitors, if_not_exists: true do |t|
      t.string :name, null: false
      t.string :normalized_name, null: false
      t.string :website
      t.boolean :active, default: true, null: false
      t.timestamps
    end

    add_index :sales_competitors, :normalized_name, unique: true, if_not_exists: true

    create_table :sales_opportunity_competitors, if_not_exists: true do |t|
      t.references :sales_opportunity, null: false, foreign_key: { to_table: :sales_opportunities }
      t.references :sales_competitor, null: false, foreign_key: { to_table: :sales_competitors }
      t.text :notes
      t.timestamps
    end

    add_index :sales_opportunity_competitors, [:sales_opportunity_id, :sales_competitor_id], name: 'idx_opp_competitors_unique', unique: true, if_not_exists: true

    create_table :sales_opportunity_contacts, if_not_exists: true do |t|
      t.references :sales_opportunity, null: false, foreign_key: { to_table: :sales_opportunities }
      t.references :sales_contact, null: false, foreign_key: { to_table: :sales_contacts }
      t.string :role, default: 'influencer', null: false # decision_maker, champion, economic_buyer, approver, influencer, technical_evaluator
      t.boolean :is_primary, default: false, null: false
      t.timestamps
    end

    add_index :sales_opportunity_contacts, [:sales_opportunity_id, :sales_contact_id], name: 'idx_opp_contacts_unique', unique: true, if_not_exists: true
  end
end
