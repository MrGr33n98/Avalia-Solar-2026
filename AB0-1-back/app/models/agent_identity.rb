# frozen_string_literal: true

class AgentIdentity
  attr_reader :agent_id, :name, :agent_type, :version, :scopes, :allowed_tools, :risk_tier_max, :tenant_id, :metadata

  REVENUE_READ_TOOLS = %w[
    revenue_search_accounts
    revenue_get_account_context
    revenue_find_prospects
    revenue_research_prospect
    revenue_list_research_records
    revenue_get_decision_committee
    revenue_list_opportunities
    revenue_get_opportunity_context
    revenue_list_due_followups
    revenue_get_founder_inbox
    revenue_get_pipeline_metrics
    revenue_get_growth_metrics
    revenue_list_audiences
    revenue_preview_audience
    revenue_get_campaign_context
  ].freeze

  REVENUE_ANALYSIS_TOOLS = %w[
    revenue_prioritize_opportunities
    revenue_preview_campaign
    revenue_prepare_followup
    revenue_prepare_email
    revenue_prepare_content_brief
    revenue_prepare_social_post
  ].freeze

  REVENUE_INTERNAL_WRITE_TOOLS = %w[
    revenue_register_prospect
    revenue_record_qualification_assessment
    revenue_create_internal_task
    revenue_refresh_founder_inbox
    revenue_prepare_campaign
  ].freeze

  REVENUE_EXTERNAL_TOOLS = %w[revenue_request_campaign_send].freeze

  REGISTERED_AGENTS = {
    'agent:observability:primary' => {
      name: 'Observability & Performance Primary Agent',
      agent_type: :observability,
      version: '1.0.0',
      scopes: %w[mcp:read mcp:admin],
      allowed_tools: %w[
        diagnose_performance
        get_system_health
        get_outbox_health
        get_postgres_health
        get_redis_health
        get_sidekiq_health
      ],
      risk_tier_max: :r0,
      tenant_id: nil
    },
    'agent:hermes:outbound' => {
      name: 'Hermes Outbound Growth Agent',
      agent_type: :growth,
      version: '1.0.0',
      scopes: %w[mcp:read mcp:analyze],
      allowed_tools: %w[
        search_companies
        search_products
        get_company_profile
        compare_companies
        get_reviews_summary
        recommend_next_actions
      ],
      risk_tier_max: :r1,
      tenant_id: nil
    },
    'agent:support:triage' => {
      name: 'Support & Moderation Triage Agent',
      agent_type: :support,
      version: '1.0.0',
      scopes: %w[mcp:read mcp:write],
      allowed_tools: %w[
        search_companies
        get_company_profile
        get_reviews_summary
        create_review_request
        get_leads_summary
      ],
      risk_tier_max: :r2,
      tenant_id: nil
    },
    'agent:engineering:primary' => {
      name: 'Engineering Governance & Platform Agent',
      agent_type: :engineering,
      version: '1.0.0',
      scopes: %w[mcp:read mcp:analyze mcp:write mcp:admin mcp:external_mutate mcp:admin:critical],
      allowed_tools: :all,
      risk_tier_max: :r4,
      tenant_id: nil
    },
    'agent:revenue:research' => {
      name: 'Revenue Research Agent',
      agent_type: :growth,
      version: '1.0.0',
      scopes: %w[mcp:read mcp:analyze],
      allowed_tools: REVENUE_READ_TOOLS + REVENUE_ANALYSIS_TOOLS,
      risk_tier_max: :r1,
      tenant_id: nil
    },
    'agent:revenue:sales-development' => {
      name: 'Sales Development Agent',
      agent_type: :growth,
      version: '1.0.0',
      scopes: %w[mcp:read mcp:analyze mcp:write],
      allowed_tools: REVENUE_READ_TOOLS + REVENUE_ANALYSIS_TOOLS + REVENUE_INTERNAL_WRITE_TOOLS,
      risk_tier_max: :r2,
      tenant_id: nil
    },
    'agent:revenue:campaign' => {
      name: 'Campaign Agent',
      agent_type: :growth,
      version: '1.0.0',
      scopes: %w[mcp:read mcp:analyze mcp:write mcp:external_mutate],
      allowed_tools: REVENUE_READ_TOOLS + REVENUE_ANALYSIS_TOOLS + REVENUE_INTERNAL_WRITE_TOOLS + REVENUE_EXTERNAL_TOOLS,
      risk_tier_max: :r3,
      tenant_id: nil
    },
    'agent:revenue:content' => {
      name: 'Content Agent',
      agent_type: :growth,
      version: '1.0.0',
      scopes: %w[mcp:read mcp:analyze],
      allowed_tools: %w[revenue_get_account_context revenue_research_prospect revenue_prepare_content_brief revenue_prepare_social_post],
      risk_tier_max: :r1,
      tenant_id: nil
    },
    'agent:revenue:growth-analyst' => {
      name: 'Growth Analyst Agent',
      agent_type: :growth,
      version: '1.0.0',
      scopes: %w[mcp:read mcp:analyze],
      allowed_tools: %w[
        revenue_find_prospects
        revenue_list_opportunities
        revenue_prioritize_opportunities
        revenue_get_pipeline_metrics
        revenue_get_growth_metrics
      ],
      risk_tier_max: :r1,
      tenant_id: nil
    }
  }.freeze

  def initialize(agent_id:, name:, agent_type:, version: '1.0.0', scopes: [], allowed_tools: [], risk_tier_max: :r0, tenant_id: nil, metadata: {})
    @agent_id = agent_id.to_s
    @name = name.to_s
    @agent_type = agent_type.to_sym
    @version = version.to_s
    @scopes = Array(scopes).map(&:to_s).uniq
    @allowed_tools = allowed_tools == :all ? :all : Array(allowed_tools).map(&:to_s).uniq
    @risk_tier_max = risk_tier_max.to_sym
    @tenant_id = tenant_id.presence ? tenant_id.to_i : nil
    @metadata = (metadata || {}).to_h.with_indifferent_access
  end

  def has_scope?(scope)
    scopes.include?(scope.to_s) || scopes.include?('mcp:admin') || scopes.include?('mcp:admin:critical')
  end

  def has_all_scopes?(required_scopes)
    Array(required_scopes).all? { |req| has_scope?(req) }
  end

  def can_execute_tool?(tool_name)
    return false if Mcp::RiskClassifier.prohibited?(tool_name)
    return true if allowed_tools == :all

    allowed_tools.include?(tool_name.to_s)
  end

  def can_handle_risk?(risk_tier)
    Mcp::RiskClassifier.risk_within_limit?(risk_tier, risk_tier_max)
  end

  def tenant_scoped?
    tenant_id.present?
  end

  def allowed_tenant?(target_tenant_id)
    return true unless tenant_scoped?
    return false if target_tenant_id.blank?

    tenant_id == target_tenant_id.to_i
  end

  def as_json(_options = {})
    {
      agent_id: agent_id,
      name: name,
      agent_type: agent_type,
      version: version,
      scopes: scopes,
      allowed_tools: allowed_tools == :all ? 'all' : allowed_tools,
      risk_tier_max: risk_tier_max,
      tenant_id: tenant_id
    }
  end

  class << self
    def find(agent_id)
      return nil if agent_id.blank?

      key = agent_id.to_s
      definition = REGISTERED_AGENTS[key]
      return nil unless definition

      new(
        agent_id: key,
        name: definition[:name],
        agent_type: definition[:agent_type],
        version: definition[:version],
        scopes: definition[:scopes],
        allowed_tools: definition[:allowed_tools],
        risk_tier_max: definition[:risk_tier_max],
        tenant_id: definition[:tenant_id]
      )
    end

    def for_user(user, client_scopes: [], client_agent_id: nil)
      return anonymous_guest unless user

      if user.admin?
        new(
          agent_id: client_agent_id.presence || "user:admin:#{user.id}",
          name: "Admin User (#{user.name || user.email})",
          agent_type: :engineering,
          scopes: (%w[mcp:read mcp:analyze mcp:write mcp:admin mcp:external_mutate mcp:admin:critical] + Array(client_scopes)).uniq,
          allowed_tools: :all,
          risk_tier_max: :r4,
          tenant_id: nil
        )
      elsif user.company_user? && user.current_company
        company_id = user.current_company.id
        new(
          agent_id: client_agent_id.presence || "user:company:#{user.id}",
          name: "Company Member (#{user.name || user.email})",
          agent_type: :support,
          scopes: (%w[mcp:read mcp:analyze mcp:write] + Array(client_scopes)).uniq,
          allowed_tools: %w[
            search_companies
            search_products
            get_company_profile
            compare_companies
            get_reviews_summary
            create_review_request
            get_company_dashboard_metrics
            get_leads_summary
            recommend_next_actions
          ] + REVENUE_READ_TOOLS + REVENUE_ANALYSIS_TOOLS + REVENUE_INTERNAL_WRITE_TOOLS,
          risk_tier_max: :r2,
          tenant_id: company_id
        )
      else
        new(
          agent_id: client_agent_id.presence || "user:consumer:#{user.id}",
          name: "Consumer User (#{user.name || user.email})",
          agent_type: :user,
          scopes: (%w[mcp:read] + Array(client_scopes)).uniq,
          allowed_tools: %w[
            search_companies
            search_products
            get_company_profile
            compare_companies
            get_reviews_summary
          ],
          risk_tier_max: :r0,
          tenant_id: nil
        )
      end
    end

    def anonymous_guest
      new(
        agent_id: 'agent:guest:anonymous',
        name: 'Anonymous Public Guest',
        agent_type: :user,
        scopes: %w[mcp:read],
        allowed_tools: %w[
          search_companies
          search_products
          get_company_profile
          compare_companies
          get_reviews_summary
        ],
        risk_tier_max: :r0,
        tenant_id: nil
      )
    end
  end
end
