# frozen_string_literal: true

module Content
  class LegacyMediaMigrationService
    Result = Struct.new(:companies_processed, :projects_created, :assets_created, keyword_init: true)

    def self.call(scope: Company.all)
      new(scope: scope).call
    end

    def initialize(scope:)
      @scope = scope
    end

    def call
      result = Result.new(companies_processed: 0, projects_created: 0, assets_created: 0)

      @scope.find_each do |company|
        next unless company.media_assets.attached? || company.company_videos.exists?

        result.companies_processed += 1
        project, created = institutional_project_for(company)
        result.projects_created += 1 if created
        result.assets_created += migrate_images(company, project)
        result.assets_created += migrate_videos(company, project)
      end

      result
    end

    private

    def institutional_project_for(company)
      project = company.company_projects.find_or_initialize_by(slug: 'midia-institucional')
      created = project.new_record?
      if created
        project.assign_attributes(
          title: 'Mídia institucional',
          summary: 'Acervo migrado do perfil anterior. Revise e publique os ativos que devem aparecer na vitrine.',
          project_type: 'Institucional',
          status: 'draft'
        )
        project.save!
      end
      [project, created]
    end

    def migrate_images(company, project)
      company.media_assets.each_with_index.count do |attachment, index|
        checksum = attachment.blob.checksum
        next false if project.digital_assets.where(kind: 'image', checksum: checksum).exists?

        asset = project.digital_assets.new(
          company: company,
          kind: 'image',
          title: attachment.filename.to_s,
          alt_text: "Imagem institucional de #{company.name}",
          status: 'pending',
          processing_status: 'ready',
          checksum: checksum,
          position: index
        )
        asset.file.attach(attachment.blob)
        asset.save!
        true
      rescue ActiveRecord::RecordInvalid => error
        Rails.logger.warn("[Content::LegacyMediaMigration] asset skipped company_id=#{company.id} blob_id=#{attachment.blob_id} error=#{error.message}")
        false
      end
    end

    def migrate_videos(company, project)
      company.company_videos.find_each.count do |video|
        next false if project.digital_assets.where(kind: 'video', external_url: video.url).exists?

        project.digital_assets.create!(
          company: company,
          kind: 'video',
          title: video.title.presence || 'Vídeo institucional',
          external_url: video.url,
          provider: video.provider,
          status: 'pending',
          processing_status: 'ready',
          position: video.position || 0,
          metadata: { legacy_company_video_id: video.id }
        )
        true
      end
    end
  end
end
