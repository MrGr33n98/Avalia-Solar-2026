# frozen_string_literal: true

module Loaders
  class AssociationLoader < GraphQL::Dataloader::Source
    def initialize(association_name)
      @association_name = association_name
    end

    def fetch(records)
      # Carrega em lote a associação para todos os records
      ActiveRecord::Associations::Preloader.new(
        records: records,
        associations: @association_name
      ).call

      # Retorna o resultado associado para cada record na mesma ordem
      records.map { |record| record.public_send(@association_name) }
    end
  end
end
