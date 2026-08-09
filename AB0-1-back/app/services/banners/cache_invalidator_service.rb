module Banners
  class CacheInvalidatorService
    # Invalida o cache granularmente baseado nos atributos do banner.
    # Incrementa as chaves de versão para position, category, state e city.
    def self.call(banner)
      return unless banner

      # Versão global (útil para mudanças que afetam tudo, se houver)
      increment_version('global')

      # Invalida a posição
      increment_version("position:#{banner.position}") if banner.position.present?

      # Invalida a categoria
      increment_version("category:#{banner.category_id}") if banner.category_id.present?
      
      # Invalida outras associações de categorias se existirem
      if banner.respond_to?(:categories) && banner.categories.loaded?
        banner.categories.each { |c| increment_version("category:#{c.id}") }
      elsif banner.respond_to?(:category_ids) && banner.category_ids.present?
        banner.category_ids.each { |id| increment_version("category:#{id}") }
      end

      # Invalida estados (arrays do PostgreSQL ou strings)
      if banner.respond_to?(:target_states) && banner.target_states.present?
        states = Array(banner.target_states)
        states.each { |s| increment_version("state:#{s.to_s.upcase}") }
      end

      # Invalida cidades
      if banner.respond_to?(:target_cities) && banner.target_cities.present?
        cities = Array(banner.target_cities)
        cities.each { |c| increment_version("city:#{c.to_s.downcase}") }
      end
    end

    def self.current_versions(params)
      {
        global: fetch_version('global'),
        position: params[:position].present? ? fetch_version("position:#{params[:position]}") : 0,
        category: params[:category_id].present? ? fetch_version("category:#{params[:category_id]}") : 0,
        state: params[:state].present? ? fetch_version("state:#{params[:state].to_s.upcase}") : 0,
        city: params[:city].present? ? fetch_version("city:#{params[:city].to_s.downcase}") : 0
      }
    end

    private

    def self.increment_version(key)
      cache_key = "banners_cache_version:#{key}"
      # Usar increment nativo do cache, ou write manual se fallback
      if Rails.cache.respond_to?(:increment) && Rails.cache.read(cache_key)
        Rails.cache.increment(cache_key)
      else
        Rails.cache.write(cache_key, fetch_version(key) + 1, raw: true)
      end
    end

    def self.fetch_version(key)
      cache_key = "banners_cache_version:#{key}"
      Rails.cache.read(cache_key, raw: true).to_i
    end
  end
end
