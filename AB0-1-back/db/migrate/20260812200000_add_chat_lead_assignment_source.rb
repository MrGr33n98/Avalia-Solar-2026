# frozen_string_literal: true

class AddChatLeadAssignmentSource < ActiveRecord::Migration[7.0]
  def change
    add_column :chat_leads, :assignment_source, :string
    add_index :chat_leads, :assignment_source
  end
end
