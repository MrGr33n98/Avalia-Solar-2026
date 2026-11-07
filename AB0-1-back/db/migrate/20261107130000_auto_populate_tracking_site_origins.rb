# frozen_string_literal: true

class AutoPopulateTrackingSiteOrigins < ActiveRecord::Migration[7.0]
  def up
    return unless defined?(::Sales::TrackingSite) && connection.data_source_exists?('sales_tracking_sites')

    # Preenche allowed_origins em todos os tracking_sites que possuam empresa com domínios autorizados
    ::Sales::TrackingSite.find_each do |site|
      next unless site.company

      company_origins = site.company.authorized_outbound_origins
      next if company_origins.blank?

      merged = (Array(site.allowed_origins) | company_origins).uniq
      site.update_columns(allowed_origins: merged) if merged != site.allowed_origins
    end
  end

  def down
    # Migração idempotente e segura sem reversão destrutiva
  end
end

