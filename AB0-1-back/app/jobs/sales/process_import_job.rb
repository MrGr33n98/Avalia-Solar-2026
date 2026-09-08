# frozen_string_literal: true

module Sales
  class ProcessImportJob < ApplicationJob
    queue_as :default

    def perform(import_id)
      import = Sales::Import.find_by(id: import_id)
      return if import.nil? || import.status_cancelled?

      Sales::Imports::ImportProcessor.call(import)
    end
  end
end
