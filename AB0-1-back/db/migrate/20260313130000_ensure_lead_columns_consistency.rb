class EnsureLeadColumnsConsistency < ActiveRecord::Migration[7.0]
  def up
    # Add estimated_budget if missing
    unless column_exists?(:leads, :estimated_budget)
      add_column :leads, :estimated_budget, :string
    end

    # Add project_type if missing (also seen in older migrations)
    unless column_exists?(:leads, :project_type)
      add_column :leads, :project_type, :string
    end

    # Add location if missing
    unless column_exists?(:leads, :location)
      add_column :leads, :location, :string
    end
  end

  def down
    # No rollback needed for safety - we want these columns to exist
  end
end
