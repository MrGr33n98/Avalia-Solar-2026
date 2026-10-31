# frozen_string_literal: true

module Sales
  class OpportunitiesMapQuery
    def self.call(params = {}, initial_scope = nil)
      new(params, initial_scope).call
    end

    def initialize(params = {}, initial_scope = nil)
      @params = params || {}
      @initial_scope = initial_scope
    end

    def call
      base_scope = @initial_scope || ::Sales::Opportunity.all
      filtered_scope = ::Sales::OpportunitiesQuery.call(@params, base_scope).unscope(:order)

      total_filtered = filtered_scope.count
      total_value_cents = filtered_scope.sum(:value_cents) || 0

      # Query agregada agrupando por localização geográfica da conta comercial e status
      # Utiliza LEFT OUTER JOIN para não descartar oportunidades sem conta ou sem localidade
      rows = filtered_scope
             .joins('LEFT JOIN sales_accounts ON sales_accounts.id = sales_opportunities.sales_account_id')
             .group(
               Arel.sql("COALESCE(sales_accounts.country, 'BR')"),
               'sales_accounts.state',
               'sales_accounts.city',
               'sales_opportunities.status'
             )
             .pluck(
               Arel.sql("COALESCE(sales_accounts.country, 'BR')"),
               'sales_accounts.state',
               'sales_accounts.city',
               'sales_opportunities.status',
               Arel.sql('COUNT(sales_opportunities.id)'),
               Arel.sql('COALESCE(SUM(sales_opportunities.value_cents), 0)')
             )

      locations_map = {}
      missing_city_state_count = 0
      unsupported_municipality_count = 0

      rows.each do |country_raw, state_raw, city_raw, status_raw, count_raw, val_cents_raw|
        count = count_raw.to_i
        val_cents = val_cents_raw.to_i
        status = status_raw.presence || 'open'
        country = country_raw.to_s.strip.upcase.presence || 'BR'
        state = state_raw.to_s.strip.upcase
        city = city_raw.to_s.strip

        if state.blank? || city.blank?
          missing_city_state_count += count
          next
        end

        if country != 'BR'
          unsupported_municipality_count += count
          next
        end

        centroid = ::Geo::CityCentroidService.coordinates_for(state: state, city: city)
        if centroid.nil?
          unsupported_municipality_count += count
          next
        end

        loc_key = "BR:#{state}:#{normalize_city_key(city)}"

        if locations_map.key?(loc_key)
          entry = locations_map[loc_key]
          entry[:lead_count] += count
          entry[:value_cents] += val_cents
          entry[:status_counts][status] = entry[:status_counts].fetch(status, 0) + count
        else
          locations_map[loc_key] = {
            key: loc_key,
            country: country,
            state: state,
            city: city,
            latitude: centroid[:lat],
            longitude: centroid[:lng],
            precision: 'municipality_centroid',
            lead_count: count,
            value_cents: val_cents,
            status_counts: { status => count }
          }
        end
      end

      locations = locations_map.values.sort_by { |l| -l[:lead_count] }

      mappable_count = locations.sum { |l| l[:lead_count] }
      mapped_value_cents = locations.sum { |l| l[:value_cents] }
      unmapped_count = total_filtered - mappable_count

      # Garante coerência caso haja inconsistência de contagem com NULLs
      if missing_city_state_count + unsupported_municipality_count < unmapped_count
        missing_city_state_count = unmapped_count - unsupported_municipality_count
      end

      applied_filters = []
      applied_filters << 'pipeline_id' if @params[:pipeline_id].present?
      applied_filters << 'q' if @params[:q].present?
      applied_filters << 'status' if @params[:status].present? || @params[:status_in].present?
      applied_filters << 'states' if @params[:states].present? || @params[:state].present?
      applied_filters << 'city' if @params[:city].present?

      {
        summary: {
          total_filtered: total_filtered,
          mappable: mappable_count,
          unmapped: unmapped_count,
          missing_city_state: missing_city_state_count,
          unsupported_municipality: unsupported_municipality_count,
          total_value_cents: total_value_cents,
          mapped_value_cents: mapped_value_cents
        },
        locations: locations,
        meta: {
          location_source: 'offline_city_centroids',
          location_dataset_version: 'current',
          as_of: Time.current.iso8601,
          filters_applied: applied_filters
        }
      }
    end

    private

    def normalize_city_key(city_name)
      ActiveSupport::Inflector.transliterate(city_name.to_s.strip).downcase.gsub(/[^a-z0-9]/, '_').squeeze('_')
    end
  end
end

