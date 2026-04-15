class CreateLeadWizardVersions < ActiveRecord::Migration[7.0]
  def change
    create_table :lead_wizard_versions do |t|
      t.references :company, foreign_key: true, null: true
      t.references :category, foreign_key: true, null: true
      t.string :template_key, null: false
      t.integer :template_version, null: false, default: 1
      t.integer :version_number, null: false, default: 1
      t.string :status, null: false, default: 'draft'
      t.string :ui_theme, null: false, default: 'auto'
      t.string :ui_primary_color
      t.string :ui_logo_url
      t.boolean :show_progress_bar, null: false, default: true
      t.string :thank_you_title
      t.text :thank_you_message
      t.string :thank_you_redirect_url
      t.datetime :published_at
      t.datetime :archived_at

      t.timestamps
    end

    add_index :lead_wizard_versions,
              %i[company_id version_number],
              unique: true,
              where: 'company_id IS NOT NULL',
              name: 'index_lead_wizard_versions_on_company_and_version'

    add_index :lead_wizard_versions,
              %i[category_id version_number],
              unique: true,
              where: 'category_id IS NOT NULL',
              name: 'index_lead_wizard_versions_on_category_and_version'

    add_index :lead_wizard_versions,
              :version_number,
              unique: true,
              where: 'company_id IS NULL AND category_id IS NULL',
              name: 'index_lead_wizard_versions_on_global_version'

    add_index :lead_wizard_versions,
              %i[company_id status],
              unique: true,
              where: "company_id IS NOT NULL AND status = 'published'",
              name: 'index_lead_wizard_versions_on_published_company'

    add_index :lead_wizard_versions,
              %i[category_id status],
              unique: true,
              where: "category_id IS NOT NULL AND status = 'published'",
              name: 'index_lead_wizard_versions_on_published_category'

    add_index :lead_wizard_versions,
              :status,
              unique: true,
              where: "company_id IS NULL AND category_id IS NULL AND status = 'published'",
              name: 'index_lead_wizard_versions_on_published_global'

    create_table :lead_wizard_sections do |t|
      t.references :lead_wizard_version, null: false, foreign_key: true
      t.string :key, null: false
      t.string :title, null: false
      t.text :description
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :lead_wizard_sections,
              %i[lead_wizard_version_id key],
              unique: true,
              name: 'index_lead_wizard_sections_on_version_and_key'

    add_index :lead_wizard_sections,
              %i[lead_wizard_version_id position],
              name: 'index_lead_wizard_sections_on_version_and_position'

    create_table :lead_wizard_fields do |t|
      t.references :lead_wizard_section, null: false, foreign_key: true
      t.string :key, null: false
      t.string :field_type, null: false
      t.string :label, null: false
      t.string :target, null: false, default: 'wizard_answers'
      t.string :placeholder
      t.text :help_text
      t.boolean :required, null: false, default: false
      t.integer :position, null: false, default: 0
      t.decimal :min_value, precision: 12, scale: 2
      t.decimal :max_value, precision: 12, scale: 2
      t.decimal :step_value, precision: 12, scale: 2
      t.string :error_message
      t.string :depends_on_field_key
      t.string :depends_on_operator
      t.string :depends_on_value
      t.string :default_value

      t.timestamps
    end

    add_index :lead_wizard_fields,
              %i[lead_wizard_section_id key],
              unique: true,
              name: 'index_lead_wizard_fields_on_section_and_key'

    add_index :lead_wizard_fields,
              %i[lead_wizard_section_id position],
              name: 'index_lead_wizard_fields_on_section_and_position'

    create_table :lead_wizard_field_options do |t|
      t.references :lead_wizard_field, null: false, foreign_key: true
      t.string :label, null: false
      t.string :value, null: false
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :lead_wizard_field_options,
              %i[lead_wizard_field_id value],
              unique: true,
              name: 'index_lead_wizard_field_options_on_field_and_value'

    add_index :lead_wizard_field_options,
              %i[lead_wizard_field_id position],
              name: 'index_lead_wizard_field_options_on_field_and_position'
  end
end
