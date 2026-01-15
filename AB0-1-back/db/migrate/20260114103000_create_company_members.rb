class CreateCompanyMembers < ActiveRecord::Migration[7.0]
  def change
    create_table :company_members do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :role, null: false, default: 2
      t.timestamps
    end
    add_index :company_members, [:company_id, :user_id], unique: true
  end
end
