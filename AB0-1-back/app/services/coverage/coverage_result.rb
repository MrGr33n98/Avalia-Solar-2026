# frozen_string_literal: true

module Coverage
  class CoverageResult
    STATUSES = %i[covered not_covered unsupported unknown].freeze
    MATCH_BASES = %i[national state city headquarters none].freeze
    SOURCES = %i[company_service_area headquarters declared_legacy none].freeze
    TRUST_LEVELS = %i[declared evidence unverified unknown].freeze

    attr_reader :status, :match_basis, :source, :trust_level, :reason, :target_territory, :company_id, :metadata

    def initialize(
      status:,
      match_basis: :none,
      source: :none,
      trust_level: :unknown,
      reason: nil,
      target_territory: nil,
      company_id: nil,
      metadata: {}
    )
      @status = status.to_sym
      @match_basis = match_basis.to_sym
      @source = source.to_sym
      @trust_level = trust_level.to_sym
      @reason = reason&.to_sym
      @target_territory = target_territory
      @company_id = company_id
      @metadata = metadata || {}
    end

    def covered?
      @status == :covered
    end

    def unsupported?
      @status == :unsupported
    end

    def not_covered?
      @status == :not_covered
    end

    def authorized_for?(purpose)
      case purpose.to_sym
      when :ranking
        # Ranking requires verified/evidence or declared territorial proof; unsupported radius is strictly rejected
        covered? && @status != :unsupported && @trust_level != :unverified
      when :lead_routing
        covered?
      when :search, :recommendation
        covered? || @match_basis == :headquarters
      else
        covered?
      end
    end

    def to_h
      {
        status: @status,
        match_basis: @match_basis,
        source: @source,
        trust_level: @trust_level,
        reason: @reason,
        target_territory: @target_territory,
        company_id: @company_id,
        metadata: @metadata
      }
    end
  end
end
