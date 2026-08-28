# frozen_string_literal: true

class BackfillInconsistentCompanyMaterials < ActiveRecord::Migration[7.0]
  def up
    # 1. Materiais NÃO published com published_at preenchido → limpar published_at
    inconsistent_published_at = CompanyMaterial.where.not(status: 'published').where.not(published_at: nil)
    count_published_at = inconsistent_published_at.count
    if count_published_at > 0
      Rails.logger.info("[Backfill] Limpando published_at de #{count_published_at} materiais com status != published")
      inconsistent_published_at.update_all(published_at: nil)
    end

    # 2. DigitalAssets published cujo CompanyMaterial pai NÃO está published → reverter asset para pending
    orphan_assets = DigitalAsset.where(attachable_type: 'CompanyMaterial', status: 'published')
                                .joins("INNER JOIN company_materials ON company_materials.id = digital_assets.attachable_id")
                                .where.not(company_materials: { status: 'published' })
    count_orphan = orphan_assets.count
    if count_orphan > 0
      Rails.logger.info("[Backfill] Revertendo #{count_orphan} DigitalAssets published com material pai não published")
      orphan_assets.update_all(status: 'pending')
    end

    # 3. Materiais published sem nenhum DigitalAsset document ready → mover para draft
    published_without_pdf = CompanyMaterial.where(status: 'published').select { |m| !m.publishable? }
    if published_without_pdf.any?
      Rails.logger.info("[Backfill] Movendo #{published_without_pdf.size} materiais published sem PDF ready para draft")
      published_without_pdf.each do |m|
        m.update_columns(status: 'draft', published_at: nil)
        m.digital_assets.where(status: 'published').update_all(status: 'pending')
      end
    end

    Rails.logger.info("[Backfill] Concluído. published_at limpos: #{count_published_at}, assets revertidos: #{count_orphan}, materiais sem PDF: #{published_without_pdf&.size || 0}")
  end

  def down
    # Backfill não é reversível de forma automática — dados já estavam inconsistentes
    Rails.logger.warn("[Backfill] Rollback do backfill: nenhuma ação automática. Revise manualmente se necessário.")
  end
end
