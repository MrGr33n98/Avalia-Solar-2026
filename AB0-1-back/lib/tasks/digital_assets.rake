namespace :digital_assets do
  desc "Corrige PDFs anexados pendentes; use DRY_RUN=false para persistir"
  task repair_processing: :environment do
    dry_run = ENV.fetch("DRY_RUN", "true") != "false"
    candidates = DigitalAsset.document.where(processing_status: "pending").where.not(status: %w[archived quarantined failed])
    checked = repaired = 0
    candidates.find_each do |asset|
      checked += 1
      next unless asset.file.attached? && asset.file.blob.present?
      next unless asset.file.blob.content_type.to_s == "application/pdf"
      repaired += 1
      asset.update!(processing_status: "ready") unless dry_run
    end
    puts "digital_assets: checked=#{checked} eligible=#{repaired} corrected=#{dry_run ? 0 : repaired} dry_run=#{dry_run}"
  end
end
