# frozen_string_literal: true

require 'digest'

class RankingScope
  VALID_BASES = %i[headquarters service_coverage].freeze

  attr_reader :methodology_release, :basis, :territory, :category_id, :project_type

  def initialize(
    methodology_release:,
    basis:,
    territory:,
    category_id: :global,
    project_type: nil
  )
    @methodology_release = methodology_release.to_s.strip
    @basis = normalize_basis(basis)
    @territory = normalize_territory(territory)
    @category_id = normalize_category(category_id)
    @project_type = project_type.presence&.to_s&.strip
  end

  def territory_canonical_id
    if @territory.respond_to?(:canonical_id)
      @territory.canonical_id
    else
      @territory.to_s
    end
  end

  def global_category?
    @category_id == :global
  end

  def canonical_tuple
    [
      @methodology_release,
      @basis.to_s,
      territory_canonical_id,
      @category_id.to_s,
      @project_type.to_s
    ]
  end

  def scope_key
    Digest::SHA256.hexdigest(canonical_tuple.join('::'))
  end

  def to_h
    {
      methodology_release: @methodology_release,
      basis: @basis,
      territory: territory_canonical_id,
      category_id: @category_id,
      project_type: @project_type,
      canonical_tuple: canonical_tuple,
      scope_key: scope_key
    }
  end

  class << self
    def from_params(params = {}, methodology_release: 'organic-performance-v2@2.0.0', **kwargs)
      merged = (params.respond_to?(:to_h) ? params.to_h : {}).merge(kwargs)
      p = merged.transform_keys(&:to_sym)

      # 1. Basis
      basis = p[:basis].presence || :service_coverage

      # 2. Territory
      territory = if p[:territory].present?
                    p[:territory]
                  elsif p[:city].present? && p[:state].present?
                    Territory.municipality(p[:city], uf: p[:state])
                  elsif p[:state].present?
                    Territory.state(p[:state])
                  else
                    Territory.country
                  end

      # 3. Category
      raw_cat = p[:category_id] || p[:category]
      category = (raw_cat.blank? || raw_cat.to_s.downcase == 'all') ? :global : raw_cat

      # 4. Project type (supports legacy `sector` parameter)
      project_type = p[:project_type].presence || p[:sector].presence

      new(
        methodology_release: methodology_release,
        basis: basis,
        territory: territory,
        category_id: category,
        project_type: project_type
      )
    end
  end

  private

  def normalize_basis(b)
    sym = b.to_sym
    raise ArgumentError, "Invalid basis: #{b}. Allowed: #{VALID_BASES.join(', ')}" unless VALID_BASES.include?(sym)

    sym
  end

  def normalize_territory(t)
    return Territory.country if t.blank? || t == :country || t == 'BR'

    if t.is_a?(Territory)
      t
    else
      Territory.resolve(t) || t
    end
  end

  def normalize_category(c)
    return :global if c.blank? || c == :global || c.to_s.downcase == 'all'

    c.is_a?(Integer) ? c : c.to_s
  end
end
