class CreateTransactionsAndMilestones < ActiveRecord::Migration[7.0]
  def change
    create_table :transactions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :status, null: false, default: 'pending'
      t.string :stripe_payment_intent_id
      t.string :description

      t.timestamps
    end

    create_table :milestones do |t|
      t.references :transaction, null: false, foreign_key: true
      t.string :title, null: false
      t.integer :percentage, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :status, null: false, default: 'locked'

      t.timestamps
    end
  end
end
