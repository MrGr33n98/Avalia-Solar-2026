# frozen_string_literal: true

require 'json'

ActiveAdmin.register LeadWizardVersion do
  menu false

  permit_params :company_id, :category_id, :template_key, :template_version, :status,
                :ui_theme, :ui_primary_color, :ui_logo_url, :show_progress_bar,
                :thank_you_title, :thank_you_message, :thank_you_redirect_url

  filter :status, as: :select, collection: proc { LeadWizardVersion.statuses.keys }
  filter :template_key
  filter :version_number
  filter :company
  filter :category
  filter :created_at

  action_item :publish, only: :show, if: proc { resource.draft? } do
    link_to 'Publish', publish_admin_lead_wizard_version_path(resource), method: :put, class: 'member_link'
  end

  action_item :archive, only: :show, if: proc { !resource.archived? } do
    link_to 'Archive', archive_admin_lead_wizard_version_path(resource), method: :put, class: 'member_link'
  end

  action_item :clone_version, only: :show do
    link_to 'Clone as Draft', clone_admin_lead_wizard_version_path(resource), method: :post, class: 'member_link'
  end

  action_item :new_section, only: :show do
    link_to 'New Section',
            new_admin_lead_wizard_section_path(lead_wizard_section: { lead_wizard_version_id: resource.id })
  end

  member_action :publish, method: :put do
    LeadWizard::VersionPublisher.call(resource)
    redirect_to resource_path(resource), notice: 'Wizard version published.'
  rescue ActiveRecord::RecordInvalid => e
    redirect_to resource_path(resource), alert: e.record.errors.full_messages.to_sentence
  end

  member_action :archive, method: :put do
    resource.update!(status: :archived, archived_at: Time.current)
    redirect_to resource_path(resource), notice: 'Wizard version archived.'
  end

  member_action :clone, method: :post do
    clone = LeadWizard::VersionCloner.call(resource)
    redirect_to edit_admin_lead_wizard_version_path(clone), notice: 'Draft clone created.'
  end

  controller do
    def scoped_collection
      super.includes(:company, :category, lead_wizard_sections: { lead_wizard_fields: :lead_wizard_field_options })
    end
  end

  index do
    selectable_column
    id_column
    column :scope_label
    column :status do |version|
      status_tag(version.status)
    end
    column :template_key
    column :template_version
    column :version_number
    column('Sections') { |version| version.lead_wizard_sections.size }
    column('Fields') { |version| version.lead_wizard_fields.size }
    column :updated_at
    actions
  end

  form html: { multipart: true } do |f|
    f.semantic_errors

    f.inputs 'Scope' do
      f.input :company,
              as: :select,
              collection: Company.order(:name).map { |company| [company.name, company.id] },
              include_blank: 'Global'
      f.input :category,
              as: :select,
              collection: Category.order(:name).map { |category| [category.name, category.id] },
              include_blank: 'Global'
    end

    f.inputs 'Version Settings' do
      f.input :template_key,
              hint: 'Chave estável para identificar a família do wizard. Ex: solar, financing, generic.'
      f.input :template_version, hint: 'Versionamento semântico do template exposto ao front.'
      f.input :status, as: :select, collection: LeadWizardVersion.statuses.keys.map { |status|
        [status.humanize, status]
      }
      f.input :ui_theme, as: :select, collection: %w[auto light dark]
      f.input :ui_primary_color
      f.input :ui_logo_url
      f.input :show_progress_bar
    end

    f.inputs 'Thank You' do
      f.input :thank_you_title
      f.input :thank_you_message, as: :text, input_html: { rows: 4 }
      f.input :thank_you_redirect_url
    end

    f.actions
  end

  show do
    attributes_table do
      row :scope_label
      row :status do |version|
        status_tag(version.status)
      end
      row :template_key
      row :template_version
      row :version_number
      row :ui_theme
      row :ui_primary_color
      row :ui_logo_url
      row :show_progress_bar
      row :thank_you_title
      row :thank_you_redirect_url
      row :published_at
      row :archived_at
      row :created_at
      row :updated_at
    end

    panel 'Sections' do
      table_for resource.lead_wizard_sections.order(:position, :id) do
        column :position
        column :key
        column :title
        column('Fields') { |section| section.lead_wizard_fields.size }
        column :description
        column :updated_at
        column('Actions') do |section|
          link_to 'Open', admin_lead_wizard_section_path(section)
        end
      end
    end

    panel 'Compiled Preview' do
      attributes_table_for resource do
        row('Schema') do |version|
          pre JSON.pretty_generate(version.compiled_schema)
        end
        row('Thank you') do |version|
          pre JSON.pretty_generate(version.compiled_thank_you_config)
        end
      end
    end
  end
end
