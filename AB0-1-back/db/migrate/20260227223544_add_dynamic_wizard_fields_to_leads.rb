class AddDynamicWizardFieldsToLeads < ActiveRecord::Migration[7.0]
  def change
    is_pg = ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    json_type = is_pg ? :jsonb : :json

    add_column :leads, :wizard_answers, json_type, default: {}
    add_column :leads, :template_key, :string
    add_column :leads, :template_version, :integer
    add_reference :leads, :category, foreign_key: true
  end
end
