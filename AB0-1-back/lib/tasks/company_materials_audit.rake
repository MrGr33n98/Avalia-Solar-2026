# frozen_string_literal: true

namespace :company_materials do
  desc 'Audita inconsistências no fluxo de publicação de materiais baixáveis das empresas'
  task audit: :environment do
    puts "=== INICIANDO AUDITORIA DE MATERIAIS BAIXÁVEIS ==="
    inconsistent_published_at = CompanyMaterial.where.not(status: 'published').where.not(published_at: nil)
    puts "\n1. Materiais com status != published E published_at preenchido: #{inconsistent_published_at.count}"
    inconsistent_published_at.each do |m|
      puts "  - Material ID: #{m.id} | Company ID: #{m.company_id} | Status: #{m.status} | Published At: #{m.published_at}"
    end

    published_without_pdf = CompanyMaterial.where(status: 'published').select { |m| !m.publishable? }
    puts "\n2. Materiais published SEM PDF ready/anexado: #{published_without_pdf.size}"
    published_without_pdf.each do |m|
      assets_info = m.digital_assets.map { |a| "Asset(id: #{a.id}, status: #{a.status}, proc: #{a.processing_status}, attached: #{a.file.attached?})" }.join(', ')
      puts "  - Material ID: #{m.id} | Company ID: #{m.company_id} | Status: #{m.status} | Assets: [#{assets_info.presence || 'Nenhum'}]"
    end

    orphan_assets = DigitalAsset.where(attachable_type: 'CompanyMaterial', status: 'published')
                                .joins("INNER JOIN company_materials ON company_materials.id = digital_assets.attachable_id")
                                .where.not(company_materials: { status: 'published' })
    puts "\n3. DigitalAssets published com material pai não published: #{orphan_assets.count}"
    orphan_assets.each do |a|
      m = a.attachable
      puts "  - Asset ID: #{a.id} | Material ID: #{m.id} | Company ID: #{m.company_id} | Material Status: #{m.status}"
    end

    gated_without_form = CompanyMaterial.where.not(gate_mode: 'none').where(content_lead_form_id: nil)
    puts "\n4. Materiais gated SEM content_lead_form associado: #{gated_without_form.count}"
    gated_without_form.each do |m|
      puts "  - Material ID: #{m.id} | Company ID: #{m.company_id} | Gate Mode: #{m.gate_mode} | Status: #{m.status}"
    end

    puts "\n=== FIM DA AUDITORIA ==="
  end

  desc 'Normaliza estados inconsistentes seguros (passar DRY_RUN=false para aplicar)'
  task normalize_safe_states: :environment do
    dry_run = ENV['DRY_RUN'] != 'false'
    puts "=== NORMALIZAÇÃO DE MATERIAIS (DRY_RUN = #{dry_run}) ==="

    # 1. Limpeza de published_at
    inconsistent_published_at = CompanyMaterial.where.not(status: 'published').where.not(published_at: nil)
    puts "\n1. Limpando published_at para materiais não publicados: #{inconsistent_published_at.count}"
    inconsistent_published_at.each do |m|
      puts "  [Ação] ID: #{m.id} (#{m.status}) | published_at #{m.published_at} -> nil"
      m.update_columns(published_at: nil) unless dry_run
    end

    # 2. Reverter assets órfãos
    orphan_assets = DigitalAsset.where(attachable_type: 'CompanyMaterial', status: 'published')
                                .joins("INNER JOIN company_materials ON company_materials.id = digital_assets.attachable_id")
                                .where.not(company_materials: { status: 'published' })
    puts "\n2. Revertendo DigitalAssets published com material pai não publicado: #{orphan_assets.count}"
    orphan_assets.each do |a|
      puts "  [Ação] Asset ID: #{a.id} | Material ID: #{a.attachable_id} (status material: #{a.attachable.status}) | status published -> pending"
      a.update_columns(status: 'pending') unless dry_run
    end

    # 3. Mover materiais publicados sem PDF para draft
    published_without_pdf = CompanyMaterial.where(status: 'published').select { |m| !m.publishable? }
    puts "\n3. Movendo materiais published sem PDF para draft: #{published_without_pdf.size}"
    published_without_pdf.each do |m|
      puts "  [Ação] Material ID: #{m.id} | status published -> draft | published_at -> nil"
      unless dry_run
        m.update_columns(status: 'draft', published_at: nil)
        m.digital_assets.where(status: 'published').update_all(status: 'pending')
      end
    end

    puts "\n=== NORMALIZAÇÃO CONCLUÍDA ==="
  end
end
