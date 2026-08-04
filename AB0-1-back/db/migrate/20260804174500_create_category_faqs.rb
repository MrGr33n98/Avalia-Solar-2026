class CreateCategoryFaqs < ActiveRecord::Migration[7.0]
  def change
    create_table :category_faqs do |t|
      t.references :category, null: false, foreign_key: true
      t.string :question, null: false
      t.text :answer, null: false
      t.integer :position, default: 0, null: false
      t.string :status, default: 'published', null: false

      t.timestamps
    end

    add_index :category_faqs, [:category_id, :position], name: 'index_category_faqs_on_category_id_and_position'
    add_index :category_faqs, [:category_id, :status], name: 'index_category_faqs_on_category_id_and_status'
  end
end
