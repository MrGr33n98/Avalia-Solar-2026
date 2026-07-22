# frozen_string_literal: true

class AddMetricsToCompanyFaqs < ActiveRecord::Migration[7.0]
  def change
    add_column :company_faqs, :views_count, :integer, default: 0, null: false
    add_column :company_faqs, :helpful_yes, :integer, default: 0, null: false
    add_column :company_faqs, :helpful_no, :integer, default: 0, null: false

    add_index :company_faqs, :views_count
  end
end
