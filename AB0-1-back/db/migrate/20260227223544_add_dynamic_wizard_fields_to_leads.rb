class AddDynamicWizardFieldsToLeads < ActiveRecord::Migration[7.0]
  def change
    add_column :leads, :wizard_answers, :jsonb, default: {}
    add_column :leads, :template_key, :string
    add_column :leads, :template_version, :integer
    add_reference :leads, :category, foreign_key: true
  end
end
