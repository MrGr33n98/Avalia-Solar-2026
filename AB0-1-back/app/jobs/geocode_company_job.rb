# frozen_string_literal: true

# Job Sidekiq para geocodificação assíncrona de empresas.
# Enfileirado automaticamente quando uma empresa é criada ou tem cidade/estado alterados.
# Pode ser enfileirado manualmente via Active Admin.
class GeocodeCompanyJob < ApplicationJob
  queue_as :default

  # Retry com backoff exponencial para respeitar rate limit do Nominatim
  retry_on StandardError, wait: :polynomially_longer, attempts: 3

  def perform(company_id, force: false)
    company = Company.find_by(id: company_id)

    unless company
      Rails.logger.warn "[GeocodeCompanyJob] Empresa #{company_id} não encontrada. Job ignorado."
      return
    end

    # Se já geocodificada com sucesso e não está forçando, pula
    if company.geocoding_status == 'success' && company.latitude.present? && !force
      Rails.logger.info "[GeocodeCompanyJob] Empresa #{company_id} já geocodificada. Pulando."
      return
    end

    Rails.logger.info "[GeocodeCompanyJob] Geocodificando empresa #{company_id} (#{company.name})..."

    result = Geo::GeocodeCompanyService.new(company).call

    if result
      Rails.logger.info "[GeocodeCompanyJob] Empresa #{company_id} geocodificada com sucesso."
    else
      Rails.logger.warn "[GeocodeCompanyJob] Empresa #{company_id} não pôde ser geocodificada."
    end
  end
end
