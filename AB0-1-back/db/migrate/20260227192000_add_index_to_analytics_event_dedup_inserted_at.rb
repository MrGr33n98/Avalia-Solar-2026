# frozen_string_literal: true

class AddIndexToAnalyticsEventDedupInsertedAt < ActiveRecord::Migration[7.0]
  def up
    # No-op: O índice 'inserted_at' já foi criado na migration 20260227170000.
    # Esta migration foi esvaziada para evitar redundância e falhas de deploy.
  end

  def down
    # No-op
  end
end
