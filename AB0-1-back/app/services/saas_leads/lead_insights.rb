# frozen_string_literal: true

require 'json'
require 'set'

module SaasLeads
  class LeadInsights
    FUNNEL_STAGE_BY_STATUS = {
      'draft' => 'Topo',
      'pending_otp' => 'Topo',
      'verified' => 'Meio',
      'distributed' => 'Meio',
      'proposal_submitted' => 'Fundo',
      'proposal_processing' => 'Fundo',
      'proposal_sent' => 'Fundo',
      'proposal_failed' => 'Perdido'
    }.freeze

    STATUS_POINTS = {
      'draft' => 0,
      'pending_otp' => 5,
      'verified' => 10,
      'distributed' => 15,
      'proposal_submitted' => 20,
      'proposal_processing' => 25,
      'proposal_sent' => 30,
      'proposal_failed' => 0
    }.freeze

    B2B_PROJECT_PROFILES = Set.new(%w[
      b2b
      business
      commercial
      industrial
      condominium
      condominiums
      empresarial
      comercial
      condominio
      condominios
      corporativo
      corporate
    ]).freeze

    JOB_TITLE_KEYS = %w[
      job_title
      cargo
      role
      position
      funcao
      buyer_role
      decision_role
    ].freeze

    COMPANY_SIZE_KEYS = %w[
      company_size
      company_size_band
      company_size_range
      porte
      company_porte
      employee_range
      employees_band
    ].freeze

    class << self
      def filter_by_score(scope, min: nil, max: nil, b2b_category_ids: nil)
        min_value = integer_or_nil(min)
        max_value = integer_or_nil(max)
        return scope if min_value.nil? && max_value.nil?

        matching_ids = []

        scope.find_in_batches(batch_size: 500) do |batch|
          batch.each do |lead|
            score = new(lead, b2b_category_ids: b2b_category_ids).score
            next if min_value && score < min_value
            next if max_value && score > max_value

            matching_ids << lead.id
          end
        end

        matching_ids.any? ? scope.where(id: matching_ids) : scope.none
      end

      private

      def integer_or_nil(value)
        return nil if value.nil?
        return nil if value.respond_to?(:blank?) && value.blank?

        Integer(value, exception: false)
      end
    end

    attr_reader :lead

    def initialize(lead, b2b_category_ids: nil)
      @lead = lead
      @b2b_category_ids = Array(b2b_category_ids).map(&:to_i).to_set if b2b_category_ids
    end

    def score
      @score ||= begin
        raw = status_points + otp_points + budget_points + decision_timeline_points + b2b_fit_points + behavior_points
        raw.clamp(0, 100)
      end
    end

    def score_band
      case score
      when 70..100
        :hot
      when 40..69
        :warm
      else
        :cold
      end
    end

    def b2b?
      @b2b ||= begin
        if @b2b_category_ids
          lead.category_id.present? && @b2b_category_ids.include?(lead.category_id.to_i)
        else
          CategoryAudienceRegistry.b2b_category?(lead.category)
        end
      end
    end

    def product_label
      lead.project_type.presence ||
        lead.product_vertical.presence ||
        lead.category&.name.presence ||
        '-'
    end

    def desired_category_label
      lead.category&.name.presence || lead.product_vertical.presence || '-'
    end

    def funnel_stage
      FUNNEL_STAGE_BY_STATUS.fetch(lead.wizard_status.to_s, 'Topo')
    end

    def distributed_count
      return lead.lead_distributions.size if lead.association(:lead_distributions).loaded?

      lead.lead_distributions.count
    end

    def converted_at
      lead.otp_verified_at
    end

    def last_sent_at
      return @last_sent_at if defined?(@last_sent_at)

      @last_sent_at =
        if lead.association(:lead_distributions).loaded?
          lead.lead_distributions.filter_map(&:assigned_at).max
        else
          lead.lead_distributions.maximum(:assigned_at)
        end
    end

    def job_title
      return lead.job_title if lead.respond_to?(:job_title) && lead.job_title.present?

      wizard_value_for(*JOB_TITLE_KEYS) || '-'
    end

    def company_size_band
      return lead.company_size_band if lead.respond_to?(:company_size_band) && lead.company_size_band.present?

      wizard_value_for(*COMPANY_SIZE_KEYS) || '-'
    end

    private

    def status_points
      STATUS_POINTS.fetch(lead.wizard_status.to_s, 0)
    end

    def otp_points
      lead.otp_verified_at.present? ? 20 : 0
    end

    def budget_points
      raw_budget = lead.estimated_budget.to_s
      return 5 if raw_budget.blank?

      amount = normalize_budget_to_number(raw_budget)
      return 10 if amount.nil?

      case amount
      when 0...20_000
        8
      when 20_000...50_000
        14
      when 50_000...100_000
        20
      else
        25
      end
    end

    def decision_timeline_points
      timeline = I18n.transliterate(lead.decision_timeline.to_s).downcase
      return 3 if timeline.blank?
      return 15 if timeline.match?(/immed|agora|urgente|hoje|30 dias|30d/)
      return 10 if timeline.match?(/3 mes|3m|90 dias|90d/)
      return 5 if timeline.match?(/6 mes|6m|180 dias|180d/)

      3
    end

    def behavior_points
      # Bonus based on real buyer intent signals
      # 2 points per signal, max 30
      timeline = SaasLeads::LeadTimeline.new(lead)
      intent_count = timeline.summary[:buyer_intent_count] || 0
      [intent_count * 2, 30].min
    rescue StandardError
      0
    end

    def b2b_fit_points
      return 0 unless b2b?

      normalized_profile = normalized_project_profile
      B2B_PROJECT_PROFILES.include?(normalized_profile) ? 10 : 0
    end

    def normalized_project_profile
      I18n.transliterate(lead.project_profile.to_s)
        .downcase
        .gsub(/[^a-z0-9]+/, '_')
        .gsub(/\A_|_\z/, '')
    end

    def wizard_value_for(*keys)
      answers = wizard_answers
      keys.each do |key|
        value = answers[key.to_s]
        return value if value.present?
      end
      nil
    end

    def wizard_answers
      return @wizard_answers if defined?(@wizard_answers)

      raw = lead.respond_to?(:wizard_answers) ? lead.wizard_answers : {}
      @wizard_answers =
        case raw
        when Hash
          raw.deep_stringify_keys
        when String
          parsed = JSON.parse(raw)
          parsed.is_a?(Hash) ? parsed.deep_stringify_keys : {}
        else
          {}
        end
    rescue JSON::ParserError
      @wizard_answers = {}
    end

    def normalize_budget_to_number(raw_budget)
      normalized = I18n.transliterate(raw_budget.to_s).downcase
      matches = normalized.scan(/\d+(?:[.,]\d+)?/)
      return nil if matches.empty?

      values = matches.map { |item| normalize_decimal(item) }.compact
      return nil if values.empty?

      value = values.max || 0.0
      
      if normalized.include?('mil') && value < 1_000
        value *= 1000
      elsif normalized.include?('mi') && value < 10_000
        value *= 1_000_000
      end

      value
    end

    def normalize_decimal(item)
      normalized = item.to_s.strip
      return nil if normalized.blank?

      if normalized.include?(',') && normalized.include?('.')
        normalized = normalized.delete('.').tr(',', '.')
      elsif normalized.include?(',')
        normalized = normalized.tr(',', '.')
      end

      Float(normalized)
    rescue ArgumentError, TypeError
      nil
    end
  end
end
