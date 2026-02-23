class CreateCompanySectorQuestions < ActiveRecord::Migration[7.0]
  def change
    create_table :company_sector_questions do |t|
      t.references :company, null: false, foreign_key: true
      t.string :prompt, null: false
      t.integer :weight, null: false, default: 1
      t.integer :order, null: false, default: 0
      t.boolean :enabled, null: false, default: true

      t.timestamps
    end
    add_index :company_sector_questions, [:company_id, :order], unique: true, name: 'index_company_sector_questions_on_company_and_order'
  end
end
