# frozen_string_literal: true

class EnhanceCompanyCategoryCapabilitiesForCuration < ActiveRecord::Migration[7.0]
  def change
    add_column :company_category_capabilities, :curation_status, :string, default: 'verified', null: false unless column_exists?(:company_category_capabilities, :curation_status)
    add_column :company_category_capabilities, :service_delivery_mode, :string, default: 'field_service', null: false unless column_exists?(:company_category_capabilities, :service_delivery_mode)
    add_column :company_category_capabilities, :evidence_json, :jsonb, default: {}, null: false unless column_exists?(:company_category_capabilities, :evidence_json)
    add_column :company_category_capabilities, :curated_by_id, :bigint unless column_exists?(:company_category_capabilities, :curated_by_id)

    add_index :company_category_capabilities,
              %i[category_id capability_type curation_status],
              name: 'idx_company_cat_capabilities_curation_lookup',
              if_not_exists: true
  end
end

