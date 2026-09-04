class CreateSalesEmailSequences < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_email_sequences do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    create_table :sales_email_sequence_steps do |t|
      t.references :email_sequence, null: false, foreign_key: { to_table: :sales_email_sequences }
      t.references :email_template, foreign_key: { to_table: :sales_email_templates }
      t.integer :position, null: false
      t.integer :delay_days, null: false, default: 0
      t.string :step_type, null: false, default: 'email'
      t.timestamps
    end
    add_index :sales_email_sequence_steps, %i[email_sequence_id position], unique: true, name: 'idx_sequence_steps_position'
  end
end
