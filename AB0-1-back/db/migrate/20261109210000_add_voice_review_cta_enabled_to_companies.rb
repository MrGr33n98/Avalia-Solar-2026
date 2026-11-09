# frozen_string_literal: true

class AddVoiceReviewCtaEnabledToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :voice_review_cta_enabled, :boolean, default: false, null: false
  end
end
