# frozen_string_literal: true

class Territory
  LEVELS = %i[country state municipality].freeze

  attr_reader :canonical_id, :level, :name, :state_code, :slug, :parent_id, :external_codes, :aliases

  def initialize(
    canonical_id:,
    level:,
    name:,
    state_code: nil,
    slug: nil,
    parent_id: nil,
    external_codes: {},
    aliases: []
  )
    @canonical_id = canonical_id.to_s
    @level = level.to_sym
    @name = name.to_s.strip
    @state_code = state_code&.to_s&.strip&.upcase
    @slug = slug.presence || self.class.slugify(@name)
    @parent_id = parent_id&.to_s
    @external_codes = (external_codes || {}).transform_keys(&:to_sym)
    @aliases = Array(aliases).map(&:to_s).uniq
  end

  def country?
    @level == :country
  end

  def state?
    @level == :state
  end

  def municipality?
    @level == :municipality
  end

  def ibge_code
    @external_codes[:ibge]
  end

  def tom_code
    @external_codes[:tom]
  end

  def matches_slug?(query_slug)
    normalized = self.class.slugify(query_slug)
    @slug == normalized || @aliases.any? { |a| self.class.slugify(a) == normalized }
  end

  class << self
    def slugify(text)
      return '' if text.blank?

      ActiveSupport::Inflector.transliterate(text.to_s)
                              .downcase
                              .gsub(/[^a-z0-9]+/, '-')
                              .gsub(/\A-+|-+\z/, '')
    end

    def country(canonical_id: 'BR', name: 'Brasil')
      new(
        canonical_id: canonical_id,
        level: :country,
        name: name,
        slug: 'brasil'
      )
    end

    def state(uf, name: nil)
      uf_clean = uf.to_s.strip.upcase
      canonical_id = "BR-#{uf_clean}"
      name ||= default_state_name(uf_clean)

      new(
        canonical_id: canonical_id,
        level: :state,
        name: name,
        state_code: uf_clean,
        slug: uf_clean.downcase,
        parent_id: 'BR'
      )
    end

    def municipality(city_name, uf:, ibge_code: nil, tom_code: nil, aliases: [])
      uf_clean = uf.to_s.strip.upcase
      slug = slugify(city_name)
      canonical_id = "BR-#{uf_clean}-#{slug}"

      new(
        canonical_id: canonical_id,
        level: :municipality,
        name: city_name,
        state_code: uf_clean,
        slug: slug,
        parent_id: "BR-#{uf_clean}",
        external_codes: { ibge: ibge_code&.to_s, tom: tom_code&.to_s }.compact,
        aliases: aliases
      )
    end

    # Deterministic resolution for legacy slugs/URLs and homonyms
    def resolve(identifier, uf: nil)
      return nil if identifier.blank?

      clean_id = identifier.to_s.strip
      clean_uf = uf&.to_s&.strip&.upcase

      # Direct canonical ID lookup
      if clean_id == 'BR' || clean_id == 'brasil'
        return country
      elsif clean_id.start_with?('BR-') && clean_id.split('-').size == 2
        return state(clean_id.split('-').last)
      elsif clean_id.start_with?('BR-') && clean_id.split('-').size >= 3
        parts = clean_id.split('-')
        uf_part = parts[1]
        slug_part = parts[2..].join('-')
        return municipality(slug_part.tr('-', ' ').titleize, uf: uf_part)
      end

      # UF resolution
      if clean_id.length == 2 && default_state_name(clean_id.upcase).present?
        return state(clean_id)
      end

      # Municipality resolution with UF hint
      if clean_uf.present?
        return municipality(clean_id, uf: clean_uf)
      end

      nil
    end

    def default_state_name(uf)
      @state_names ||= {
        'AC' => 'Acre', 'AL' => 'Alagoas', 'AP' => 'Amapá', 'AM' => 'Amazonas',
        'BA' => 'Bahia', 'CE' => 'Ceará', 'DF' => 'Distrito Federal', 'ES' => 'Espírito Santo',
        'GO' => 'Goiás', 'MA' => 'Maranhão', 'MT' => 'Mato Grosso', 'MS' => 'Mato Grosso do Sul',
        'MG' => 'Minas Gerais', 'PA' => 'Pará', 'PB' => 'Paraíba', 'PR' => 'Paraná',
        'PE' => 'Pernambuco', 'PI' => 'Piauí', 'RJ' => 'Rio de Janeiro', 'RN' => 'Rio Grande do Norte',
        'RS' => 'Rio Grande do Sul', 'RO' => 'Rondônia', 'RR' => 'Roraima', 'SC' => 'Santa Catarina',
        'SP' => 'São Paulo', 'SE' => 'Sergipe', 'TO' => 'Tocantins'
      }.freeze
      @state_names[uf]
    end
  end
end
