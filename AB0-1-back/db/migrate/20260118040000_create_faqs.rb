# frozen_string_literal: true

class CreateFaqs < ActiveRecord::Migration[7.0]
  def change
    create_table :faqs do |t|
      t.string :question, null: false
      t.text :answer, null: false
      t.string :category, null: false, default: 'geral'
      t.integer :position, null: false, default: 0
      t.boolean :active, null: false, default: true
      t.integer :helpful_yes, null: false, default: 0
      t.integer :helpful_no, null: false, default: 0

      t.timestamps
    end

    add_index :faqs, :category
    add_index :faqs, :active
    add_index :faqs, [:category, :active]
  end
end
