# frozen_string_literal: true

class BackfillMarketplaceProposalDrafts < ActiveRecord::Migration[7.0]
  def up
    LeadDistribution.where(status: %w[sent viewed accepted]).find_each do |distribution|
      Marketplace::ProposalBootstrapService.new(distribution: distribution).call
    rescue StandardError => e
      Rails.logger.warn("[Migration Backfill Error] distribution_id=#{distribution.id}: #{e.message}")
    end
  end

  def down
    # Migration de dados idempotente não remove propostas existentes criadas por usuários
  end
end
