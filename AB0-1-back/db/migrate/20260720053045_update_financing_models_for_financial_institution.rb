class UpdateFinancingModelsForFinancialInstitution < ActiveRecord::Migration[7.0]
  def change
    # Update financing_options
    add_reference :financing_options, :financial_institution, foreign_key: true
    change_column_null :financing_options, :company_id, true
    change_column_null :financing_options, :institution_name, true

    add_column :financing_options, :minimum_project_value, :decimal, precision: 12, scale: 2
    add_column :financing_options, :maximum_project_value, :decimal, precision: 12, scale: 2
    add_column :financing_options, :minimum_down_payment_percentage, :decimal, precision: 5, scale: 2
    add_column :financing_options, :maximum_down_payment_percentage, :decimal, precision: 5, scale: 2
    add_column :financing_options, :amortization_system, :string
    add_column :financing_options, :display_order, :integer, default: 0
    add_column :financing_options, :valid_from, :date
    add_column :financing_options, :valid_until, :date
    add_column :financing_options, :terms_url, :string

    # Update banners
    add_reference :banners, :financial_institution, foreign_key: true
    add_reference :banners, :financing_option, foreign_key: true
  end
end
