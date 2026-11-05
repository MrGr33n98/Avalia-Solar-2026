# frozen_string_literal: true

class AddVideoLinksToCompanyServices < ActiveRecord::Migration[7.0]
  def change
    add_column :company_services, :video_links, :jsonb, null: false, default: []
  end
end
