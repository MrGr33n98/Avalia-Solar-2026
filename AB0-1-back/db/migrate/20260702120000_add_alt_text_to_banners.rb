# frozen_string_literal: true

class AddAltTextToBanners < ActiveRecord::Migration[7.0]
  def change
    add_column :banners, :alt_text, :string
  end
end
