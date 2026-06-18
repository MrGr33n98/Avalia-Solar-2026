# frozen_string_literal: true

class EnableSearchTextExtensions < ActiveRecord::Migration[7.0]
  def change
    enable_extension 'unaccent' unless extension_enabled?('unaccent')
    enable_extension 'pg_trgm' unless extension_enabled?('pg_trgm')
  end
end
