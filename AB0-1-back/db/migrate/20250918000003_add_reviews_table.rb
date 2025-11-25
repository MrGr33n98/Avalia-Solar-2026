class AddReviewsTable < ActiveRecord::Migration[7.0]
  def change
    # Check if the columns exist before trying to modify them
    if table_exists?(:reviews)
      # Add company reference if it doesn't exist
      unless column_exists?(:reviews, :company_id)
        add_reference :reviews, :company, foreign_key: true
      end
      
      # Add verified column if it doesn't exist
      unless column_exists?(:reviews, :verified)
        add_column :reviews, :verified, :boolean, default: false
      end
      
      # Add featured column if it doesn't exist
      unless column_exists?(:reviews, :featured)
        add_column :reviews, :featured, :boolean, default: false
      end

      # Update rating column to use decimal if it's not already
      if column_exists?(:reviews, :rating) && !column_exists?(:reviews, :rating, :decimal)
        change_column :reviews, :rating, :decimal, precision: 2, scale: 1
      end
      
      # Remove product reference only if it exists
      if column_exists?(:reviews, :product_id)
        remove_reference :reviews, :product, foreign_key: true
      end
      
      # Add unique index if it doesn't exist
      unless index_exists?(:reviews, [:company_id, :user_id])
        add_index :reviews, [:company_id, :user_id], unique: true
      end
    end
  end
end