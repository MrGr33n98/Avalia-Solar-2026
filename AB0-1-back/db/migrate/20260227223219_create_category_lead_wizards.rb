class CreateCategoryLeadWizards < ActiveRecord::Migration[7.0]
  def change
    create_table :category_lead_wizards do |t|
      t.belongs_to :category, null: false, foreign_key: true, index: { unique: true }
      t.boolean :enabled, default: true, null: false
      t.string :template_key
      t.integer :template_version, default: 1
      t.jsonb :schema, default: {}
      t.jsonb :thank_you_config, default: {}

      t.timestamps
    end
  end
end
