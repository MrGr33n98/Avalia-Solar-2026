# frozen_string_literal: true

module Ranking
  class ScopeResolutionResult
    attr_reader :requested_scope, :candidate_scopes, :resolved_scope, :reason, :rejection_reasons

    def initialize(
      requested_scope:,
      candidate_scopes:,
      resolved_scope: nil,
      reason: nil,
      rejection_reasons: {}
    )
      @requested_scope = requested_scope
      @candidate_scopes = Array(candidate_scopes)
      @resolved_scope = resolved_scope
      @reason = reason&.to_sym
      @rejection_reasons = rejection_reasons || {}
    end

    def resolved?
      @resolved_scope.present?
    end

    def fallback?
      resolved? && @resolved_scope.scope_key != @requested_scope.scope_key
    end

    def no_eligible_scope?
      @resolved_scope.nil?
    end

    def to_h
      {
        requested_scope: @requested_scope.to_h,
        candidate_scopes: @candidate_scopes.map(&:to_h),
        resolved_scope: @resolved_scope&.to_h,
        reason: @reason,
        rejection_reasons: @rejection_reasons,
        resolved: resolved?,
        fallback: fallback?,
        no_eligible_scope: no_eligible_scope?
      }
    end
  end

  class ScopeResolver
    attr_reader :gate_evaluator

    def initialize(gate_evaluator: nil)
      @gate_evaluator = gate_evaluator
    end

    # Builds ladder: municipality -> state -> country
    def resolve(requested_scope, &candidate_validator)
      candidates = build_candidate_ladder(requested_scope)
      rejection_reasons = {}

      candidates.each_with_index do |candidate, index|
        passes = if candidate_validator
                   candidate_validator.call(candidate)
                 elsif @gate_evaluator
                   @gate_evaluator.evaluate(candidate).passed?
                 else
                   true
                 end

        if passes
          reason = index.zero? ? :requested_scope_passed : :broadened_to_parent_territory
          return ScopeResolutionResult.new(
            requested_scope: requested_scope,
            candidate_scopes: candidates,
            resolved_scope: candidate,
            reason: reason,
            rejection_reasons: rejection_reasons
          )
        else
          rejection_reasons[candidate.territory_canonical_id] = :insufficient_population_or_ineligible
        end
      end

      # All candidates failed
      ScopeResolutionResult.new(
        requested_scope: requested_scope,
        candidate_scopes: candidates,
        resolved_scope: nil,
        reason: :no_eligible_scope,
        rejection_reasons: rejection_reasons
      )
    end

    def build_candidate_ladder(scope)
      ladder = [scope]
      territory = scope.territory.is_a?(Territory) ? scope.territory : Territory.resolve(scope.territory_canonical_id)

      return ladder unless territory

      if territory.municipality? && territory.state_code.present?
        # Add state candidate
        state_territory = Territory.state(territory.state_code)
        ladder << clone_scope_with_territory(scope, state_territory)

        # Add country candidate
        ladder << clone_scope_with_territory(scope, Territory.country)
      elsif territory.state?
        # Add country candidate
        ladder << clone_scope_with_territory(scope, Territory.country)
      end

      ladder.uniq(&:scope_key)
    end

    private

    def clone_scope_with_territory(original_scope, new_territory)
      RankingScope.new(
        methodology_release: original_scope.methodology_release,
        basis: original_scope.basis,
        territory: new_territory,
        category_id: original_scope.category_id,
        project_type: original_scope.project_type
      )
    end
  end
end
