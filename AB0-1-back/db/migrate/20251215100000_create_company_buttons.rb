class CreateCompanyButtons < ActiveRecord::Migration[7.0]
  def change
    create_table :company_buttons do |t|
      t.references :company, null: false, foreign_key: true
      t.string :label
      t.string :url
      t.boolean :active, default: true
      t.integer :position
      t.string :button_type

      t.timestamps
    end
  end
end
