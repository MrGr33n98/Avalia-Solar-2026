# frozen_string_literal: true

require 'securerandom'

class RankingRun
  STATUSES = %i[pending running completed failed].freeze

  attr_reader :run_id, :manifest, :as_of, :computed_at, :requested_scope,
              :resolved_scope, :resolution_result, :gate_summary, :status, :metadata

  def initialize(
    manifest:,
    requested_scope:,
    as_of: Time.current.beginning_of_day,
    computed_at: Time.current,
    resolved_scope: nil,
    resolution_result: nil,
    gate_summary: nil,
    status: :completed,
    metadata: {}
  )
    @run_id = SecureRandom.uuid
    @manifest = manifest
    @as_of = as_of
    @computed_at = computed_at
    @requested_scope = requested_scope
    @resolved_scope = resolved_scope || requested_scope
    @resolution_result = resolution_result
    @gate_summary = gate_summary
    @status = status.to_sym
    @metadata = metadata || {}
  end

  def completed?
    @status == :completed
  end

  def to_h
    {
      run_id: @run_id,
      manifest_release: @manifest.respond_to?(:release_identifier) ? @manifest.release_identifier : @manifest.to_s,
      parameter_digest: @manifest.respond_to?(:parameter_digest) ? @manifest.parameter_digest : nil,
      as_of: @as_of.iso8601,
      computed_at: @computed_at.iso8601,
      requested_scope: @requested_scope.to_h,
      resolved_scope: @resolved_scope&.to_h,
      resolution_result: @resolution_result&.to_h,
      gate_summary: @gate_summary&.to_h,
      status: @status,
      metadata: @metadata
    }
  end
end
