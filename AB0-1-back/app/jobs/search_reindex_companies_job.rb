# frozen_string_literal: true

# Job para indexação das empresas no OpenSearch de forma assíncrona
class SearchReindexCompaniesJob < ApplicationJob
  queue_as :default

  def perform(company_id = nil)
    unless ENV['SEARCH_ENABLED'] == 'true'
      Rails.logger.warn '[Search] Reindex automático abortado: SEARCH_ENABLED está inativo.'
      return
    end

    if company_id.present?
      company = Company.find_by(id: company_id)
      if company
        Rails.logger.info "[Search] Reindexando empresa específica: ID #{company.id} - #{company.name}..."
        company.reindex
      else
        Rails.logger.error "[Search] Empresa com ID #{company_id} não encontrada para reindexação."
      end
    else
      Rails.logger.info '[Search] Iniciando reindexação completa de todas as empresas no OpenSearch...'
      Company.reindex
      Rails.logger.info '[Search] Reindexação completa concluída com sucesso!'
    end
  end
end
