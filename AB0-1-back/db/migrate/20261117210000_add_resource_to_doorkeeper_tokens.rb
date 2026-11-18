# frozen_string_literal: true

class AddResourceToDoorkeeperTokens < ActiveRecord::Migration[7.0]
  def change
    add_column :oauth_access_grants, :resource, :string unless column_exists?(:oauth_access_grants, :resource)
    add_column :oauth_access_tokens, :resource, :string unless column_exists?(:oauth_access_tokens, :resource)
  end
end
