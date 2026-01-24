class CreateCompanyFaqs < ActiveRecord::Migration[7.0]
  def change
    create_table :company_faqs do |t|
      t.references :company, null: false, foreign_key: true
      t.string :question, null: false
      t.text :answer, null: false
      t.integer :position, null: false, default: 0
      t.string :status, null: false, default: 'published'

      t.timestamps
    end

    add_index :company_faqs, [:company_id, :status]
    add_index :company_faqs, [:company_id, :position]
  end
end
