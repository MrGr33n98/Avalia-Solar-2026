# frozen_string_literal: true

class AddBtreeIndexToPlatformEventsOccurredAt < ActiveRecord::Migration[7.0]
  def up
    # No-op: O índice individual em 'occurred_at' geraria lock em tabela particionada.
    # A performance de busca temporal já é garantida pelos índices da migration 20260227171000.
  end

  def down
    # No-op
  end
end
