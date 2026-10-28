# frozen_string_literal: true

module Sales
  class EmailSyncState < ApplicationRecord
    self.table_name = 'sales_email_sync_states'

    belongs_to :company
    belongs_to :email_account, class_name: 'Sales::EmailAccount', foreign_key: :sales_email_account_id

    validates :provider_folder_id, presence: true

    scope :inbox, -> { where(provider_folder_id: 'inbox') }
    scope :sent, -> { where(provider_folder_id: 'sent') }
  end
end
