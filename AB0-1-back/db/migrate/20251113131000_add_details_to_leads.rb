class AddDetailsToLeads < ActiveRecord::Migration[7.0]
  def change
    add_column :leads, :project_type, :string
    add_column :leads, :estimated_budget, :string
    add_column :leads, :location, :string
    add_reference :leads, :company, foreign_key: true
  end
end

