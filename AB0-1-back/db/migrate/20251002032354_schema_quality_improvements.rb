class SchemaQualityImprovements < ActiveRecord::Migration[7.0]
  def change
    # 1. Add unique indexes (safe checks)
    add_index :categories, :seo_url, unique: true unless index_exists?(:categories, :seo_url, unique: true)
    add_index :products, :sku, unique: true unless index_exists?(:products, :sku, unique: true)
    add_index :companies, [:state, :city] unless index_exists?(:companies, [:state, :city])
    add_index :reviews, [:company_id, :created_at] unless index_exists?(:reviews, [:company_id, :created_at])

    # 2. Foreign keys for join tables (if not already present)
    unless foreign_key_exists?(:categories_products, :products)
      add_foreign_key :categories_products, :products
    end
    unless foreign_key_exists?(:categories_products, :categories)
      add_foreign_key :categories_products, :categories
    end
    unless foreign_key_exists?(:categories_companies, :companies)
      add_foreign_key :categories_companies, :companies
    end
    unless foreign_key_exists?(:categories_companies, :categories)
      add_foreign_key :categories_companies, :categories
    end

    # 3. Monetary / numeric column precision adjustments (skip if already precise)
    change_column :products, :price, :decimal, precision: 12, scale: 2 if column_exists?(:products, :price)
    change_column :plans, :price, :decimal, precision: 12, scale: 2 if column_exists?(:plans, :price)
    change_column :pricings, :value, :decimal, precision: 12, scale: 2 if column_exists?(:pricings, :value)
    change_column :subscription_plans, :value, :decimal, precision: 12, scale: 2 if column_exists?(:subscription_plans, :value)

    # 4. Enforce numeric integrity where appropriate
    # Add check constraints if not present
    unless constraint_exists?(:reviews, 'chk_reviews_rating_range')
      execute "ALTER TABLE reviews ADD CONSTRAINT chk_reviews_rating_range CHECK (rating >= 0 AND rating <= 5)" rescue nil
    end

    # 5. Clean up rating_cache (legacy) if not referenced anymore
    if column_exists?(:companies, :rating_cache)
      # Leaving removal optional to avoid breaking unknown code paths. Comment out if sure:
      # remove_column :companies, :rating_cache
    end

    # 6. Ensure boolean defaults (only set if currently null default)
    change_column_default :products, :featured, from: nil, to: false if column_exists?(:products, :featured)
    change_column_default :categories, :featured, from: nil, to: false if column_exists?(:categories, :featured)
    change_column_default :banners, :active, from: nil, to: false if column_exists?(:banners, :active)

    # 7. Add partial indexes for featured / verified (optional performance)
    unless index_exists?(:companies, :featured, where: "featured = true")
      add_index :companies, :featured, where: "featured = true", name: 'index_companies_on_featured_true'
    end
    unless index_exists?(:companies, :verified, where: "verified = true")
      add_index :companies, :verified, where: "verified = true", name: 'index_companies_on_verified_true'
    end
  end

  private

  # Helper to detect existing constraints (Rails lacks a direct helper for arbitrary CHECK constraints)
  def constraint_exists?(table, constraint_name)
    query = <<~SQL
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name='#{table}' AND constraint_name='#{constraint_name}'
    SQL
    result = execute(query) rescue []
    result.any?
  end
end
