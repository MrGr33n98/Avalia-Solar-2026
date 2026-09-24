# frozen_string_literal: true

require 'digest'
require 'json'

class MethodologyManifest
  STATUSES = %i[draft published archived].freeze

  attr_reader :manifest_id, :release_version, :status, :components, :created_at

  def initialize(
    manifest_id:,
    release_version:,
    status: :draft,
    components: [],
    created_at: Time.current
  )
    @manifest_id = manifest_id.to_s.strip
    @release_version = release_version.to_s.strip
    @status = status.to_sym
    @components = components.map { |c| normalize_component(c) }.freeze
    @created_at = created_at
    @parameter_digest = compute_digest
    freeze if published?
  end

  def release_identifier
    "#{@manifest_id}@#{@release_version}"
  end

  def published?
    @status == :published
  end

  def parameter_digest
    @parameter_digest ||= compute_digest
  end

  def component(name)
    @components.find { |c| c[:name].to_s == name.to_s }
  end

  def to_h
    {
      manifest_id: @manifest_id,
      release_version: @release_version,
      release_identifier: release_identifier,
      status: @status,
      parameter_digest: parameter_digest,
      components: @components,
      created_at: @created_at.iso8601
    }
  end

  class << self
    def organic_v2(status: :published)
      new(
        manifest_id: 'organic-performance-v2',
        release_version: '2.0.0',
        status: status,
        components: [
          {
            name: 'trust_score',
            version: '2.0',
            weight: 0.35,
            parameters: { min_reviews: 1, base_decay_days: 90 }
          },
          {
            name: 'delivered_projects',
            version: '2.0',
            weight: 0.30,
            parameters: { score_scale: 100 }
          },
          {
            name: 'response_sla',
            version: '2.0',
            weight: 0.20,
            parameters: { max_sla_hours: 48 }
          },
          {
            name: 'warranty_years',
            version: '2.0',
            weight: 0.15,
            parameters: { standard_warranty_years: 5 }
          }
        ]
      )
    end
  end

  private

  def normalize_component(comp)
    c = comp.transform_keys(&:to_sym)
    {
      name: c[:name].to_s,
      version: c[:version].to_s,
      weight: c[:weight]&.to_f,
      parameters: (c[:parameters] || {}).transform_keys(&:to_s)
    }
  end

  def compute_digest
    canonical_json = JSON.generate(
      {
        manifest_id: @manifest_id,
        release_version: @release_version,
        components: @components
      }
    )
    Digest::SHA256.hexdigest(canonical_json)
  end
end
