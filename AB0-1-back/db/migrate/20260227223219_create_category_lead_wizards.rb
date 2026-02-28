class CreateCategoryLeadWizards < ActiveRecord::Migration[7.0]
  def change
    is_pg = ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    json_type = is_pg ? :jsonb : :json

    create_table :category_lead_wizards do |t|
      t.belongs_to :category, null: false, foreign_key: true, index: { unique: true }
      t.boolean :enabled, default: true, null: false
      t.string :template_key
      t.integer :template_version, default: 1
      t.column :schema, json_type, default: {}
      t.column :thank_you_config, json_type, default: {}

      t.timestamps
    end
  end
end
