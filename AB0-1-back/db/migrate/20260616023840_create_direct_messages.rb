class CreateDirectMessages < ActiveRecord::Migration[7.0]
  def change
    create_table :direct_messages do |t|
      t.references :conversation, null: false, foreign_key: true
      t.text :body
      t.string :sender_type
      t.datetime :read_at

      t.timestamps
    end
  end
end
