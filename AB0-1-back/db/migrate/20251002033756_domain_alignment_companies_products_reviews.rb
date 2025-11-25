class DomainAlignmentCompaniesProductsReviews < ActiveRecord::Migration[7.0]
  def up
    # 1. Remove legacy rating_cache if safe
    if column_exists?(:companies, :rating_cache)
      remove_column :companies, :rating_cache
    end

    # 2. Ensure reviews belong only to companies (already structure wise) - remove stray product references if any leftover (defensive)
    if column_exists?(:reviews, :product_id)
      remove_reference :reviews, :product, foreign_key: true
    end

    # 3. Add NOT NULL constraints for core domain integrity
    change_null :companies, :name, false if column_exists?(:companies, :name) && null_allowed?(:companies, :name)
    change_null :products, :name, false if column_exists?(:products, :name) && null_allowed?(:products, :name)
    change_null :reviews, :rating, false if column_exists?(:reviews, :rating) && null_allowed?(:reviews, :rating)

    # 4. Add check constraint for rating precision if not present (already have range; enforce single decimal if desired?)
    # Skipped for now to avoid over-constraining.

    # 5. Add counter cache setup hint (no DB change). We ensure rating_count & rating_avg defaults are correct.
    change_column_default :companies, :rating_avg, from: "0.0", to: 0.0 if column_exists?(:companies, :rating_avg)
    change_column_default :companies, :rating_count, from: nil, to: 0 if column_exists?(:companies, :rating_count)

    # 6. Optional: enforce company presence on products if domain now requires
    if column_exists?(:products, :company_id)
      # Set orphan products company_id to NULL-safe fallback (skip if none). If business rule requires deletion, handle externally.
      # Then enforce NOT NULL
      execute <<~SQL
        UPDATE products SET company_id = (
          SELECT id FROM companies ORDER BY id ASC LIMIT 1
        ) WHERE company_id IS NULL;
      SQL
      change_null :products, :company_id, false if null_allowed?(:products, :company_id)
    end
  end

  def down
    add_column :companies, :rating_cache, :decimal, precision: 3, scale: 1 unless column_exists?(:companies, :rating_cache)
    change_null :companies, :name, true if column_exists?(:companies, :name) && !null_allowed?(:companies, :name)
    change_null :products, :name, true if column_exists?(:products, :name) && !null_allowed?(:products, :name)
    change_null :reviews, :rating, true if column_exists?(:reviews, :rating) && !null_allowed?(:reviews, :rating)
    change_null :products, :company_id, true if column_exists?(:products, :company_id) && !null_allowed?(:products, :company_id)
  end

  private

  # Helpers to check nullability
  def null_allowed?(table, column)
    result = ActiveRecord::Base.connection.execute(<<~SQL)
      SELECT is_nullable FROM information_schema.columns
      WHERE table_name='#{table}' AND column_name='#{column}'
    SQL
    row = result.first
    return true unless row
    row['is_nullable'] == 'YES'
  end

  def change_null(table, column, allow_null)
    change_column_null table, column, allow_null
  end
end
