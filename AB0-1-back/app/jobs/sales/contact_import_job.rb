# frozen_string_literal: true

module Sales
  class ContactImportJob < ApplicationJob
    queue_as :default

    def perform(import_id)
      import = ::Sales::ContactImport.find_by(id: import_id)
      return unless import
      return if %w[completed cancelled failed].include?(import.status)

      ::Sales::Contacts::ImportService.call(import: import)
    end
  end
end
