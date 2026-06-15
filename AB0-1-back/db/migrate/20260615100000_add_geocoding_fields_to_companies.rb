# frozen_string_literal: true

class AddGeocodingFieldsToCompanies < ActiveRecord::Migration[7.0]
  def change
    # Adiciona campos de controle de geocoding
    # latitude e longitude já existem desde a migration 20231020123460
    add_column :companies, :geocoded_at, :datetime
    add_column :companies, :geocoding_status, :string, default: 'pending'

    # Índice para consultas por status de geocoding (ex: empresas pendentes de geocodificação)
    add_index :companies, :geocoding_status, name: 'index_companies_on_geocoding_status'

    # Índice composto lat/lng para queries de proximidade no fallback PostgreSQL
    add_index :companies, %i[latitude longitude],
              name: 'index_companies_on_lat_lng',
              where: 'latitude IS NOT NULL AND longitude IS NOT NULL'
  end
end
