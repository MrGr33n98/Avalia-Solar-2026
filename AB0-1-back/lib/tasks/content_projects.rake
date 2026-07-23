# frozen_string_literal: true

namespace :content do
  desc 'Migra mídia legada para projetos institucionais em rascunho (não publica conteúdo)'
  task migrate_legacy_media: :environment do
    company_id = ENV['COMPANY_ID'].presence
    scope = company_id ? Company.where(id: company_id) : Company.all
    result = ContentManagement::LegacyMediaMigrationService.call(scope: scope)
    puts "Empresas: #{result.companies_processed}; projetos criados: #{result.projects_created}; ativos migrados: #{result.assets_created}"
  end
end
