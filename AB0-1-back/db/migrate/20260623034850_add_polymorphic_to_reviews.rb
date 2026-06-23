class AddPolymorphicToReviews < ActiveRecord::Migration[7.0]
  def up
    add_column :reviews, :reviewable_type, :string
    add_column :reviews, :reviewable_id, :bigint
    add_index :reviews, [:reviewable_type, :reviewable_id]

    # Backfill: Migrar reviews existentes para pertencerem a Company
    execute "UPDATE reviews SET reviewable_type = 'Company', reviewable_id = company_id WHERE company_id IS NOT NULL"
  end

  def down
    remove_index :reviews, [:reviewable_type, :reviewable_id]
    remove_column :reviews, :reviewable_id
    remove_column :reviews, :reviewable_type
  end
end
