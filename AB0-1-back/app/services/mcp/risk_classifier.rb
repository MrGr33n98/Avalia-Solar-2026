# frozen_string_literal: true

module Mcp
  class RiskClassifier
    RISK_LEVELS = {
      r0: 0,
      r1: 1,
      r2: 2,
      r3: 3,
      r4: 4
    }.freeze

    # Ferramentas expressamente proibidas por governança e segurança
    PROHIBITED_TOOLS = %w[
      execute_sql
      raw_sql_query
      arbitrary_sql
      dbhub_query
      exec_shell
      bash_command
      system_exec
      run_shell_command
      drop_database
      truncate_tables
    ].freeze

    # Catálogo de classificação de risco e escopos canônicos
    CLASSIFICATION_CATALOG = {
      # R0: Safe Read-Only
      'search_companies' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read],
        hitl_required: false,
        description: 'Busca pública de empresas e instaladores'
      },
      'search_products' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read],
        hitl_required: false,
        description: 'Busca pública de produtos e equipamentos solares'
      },
      'get_company_profile' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read],
        hitl_required: false,
        description: 'Consulta de perfil detalhado de empresa'
      },
      'compare_companies' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read],
        hitl_required: false,
        description: 'Comparativo de métricas e reputação entre empresas'
      },
      'get_reviews_summary' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read],
        hitl_required: false,
        description: 'Sumário analítico de avaliações'
      },
      'get_company_dashboard_metrics' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read],
        hitl_required: false,
        description: 'Métricas analíticas do dashboard tenant-scoped'
      },
      'get_leads_summary' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read],
        hitl_required: false,
        description: 'Sumário e volumetria de leads da empresa'
      },
      'get_market_snapshot' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read mcp:admin],
        hitl_required: false,
        description: 'Snapshot consolidado de mercado para administradores'
      },
      'diagnose_performance' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read mcp:admin],
        hitl_required: false,
        description: 'Diagnóstico holístico de performance e observabilidade'
      },
      'get_system_health' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read mcp:admin],
        hitl_required: false,
        description: 'Healthcheck multi-componente da stack'
      },
      'get_outbox_health' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read mcp:admin],
        hitl_required: false,
        description: 'Métricas e liveness da fila transacional Outbox'
      },
      'get_postgres_health' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read mcp:admin],
        hitl_required: false,
        description: 'Métricas de conexões e pool do PostgreSQL'
      },
      'get_redis_health' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read mcp:admin],
        hitl_required: false,
        description: 'Métricas de conexões e latência do Redis'
      },
      'get_sidekiq_health' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read mcp:admin],
        hitl_required: false,
        description: 'Métricas de filas, retries e latência do Sidekiq'
      },

      # R1: Safe Computation / Analysis / Draft
      'recommend_next_actions' => {
        risk_tier: :r1,
        required_scopes: %w[mcp:analyze],
        hitl_required: false,
        description: 'Motor de recomendação e próximos passos operacionais'
      },

      # R2: Internal Low-Impact Write
      'create_review_request' => {
        risk_tier: :r2,
        required_scopes: %w[mcp:write],
        hitl_required: false,
        description: 'Criação interna de solicitação de avaliação'
      },

      # R3: High-Impact / External Mutating (Requer HITL)
      'send_outbound_campaign' => {
        risk_tier: :r3,
        required_scopes: %w[mcp:external_mutate],
        hitl_required: true,
        description: 'Disparo de comunicações outbound em lote para prospects'
      },
      'bulk_lead_export' => {
        risk_tier: :r3,
        required_scopes: %w[mcp:external_mutate],
        hitl_required: true,
        description: 'Exportação em lote de dados sensíveis de leads'
      },
      'publish_company_update' => {
        risk_tier: :r3,
        required_scopes: %w[mcp:external_mutate],
        hitl_required: true,
        description: 'Publicação pública de atualização institucional'
      },

      # R4: Financial / Security / Destructive Mutations (Requer Mandatory HITL)
      'charge_subscription' => {
        risk_tier: :r4,
        required_scopes: %w[mcp:admin:critical],
        hitl_required: true,
        description: 'Processamento financeiro e cobrança direta'
      },
      'delete_tenant_data' => {
        risk_tier: :r4,
        required_scopes: %w[mcp:admin:critical],
        hitl_required: true,
        description: 'Exclusão irrevogável de dados de inquilino'
      },
      'grant_admin_role' => {
        risk_tier: :r4,
        required_scopes: %w[mcp:admin:critical],
        hitl_required: true,
        description: 'Elevação de privilégios e concessão de perfil administrador'
      },

      # Control Plane Approval Governance Tools
      'approval_list' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read],
        hitl_required: false,
        description: 'Consulta e listagem operacional de solicitações de aprovação'
      },
      'approval_get' => {
        risk_tier: :r0,
        required_scopes: %w[mcp:read],
        hitl_required: false,
        description: 'Consulta detalhada e política de solicitação de aprovação'
      },
      'approval_approve' => {
        risk_tier: :r3,
        required_scopes: %w[mcp:admin mcp:write],
        hitl_required: false,
        description: 'Aprovação humana de solicitação de governança'
      },
      'approval_reject' => {
        risk_tier: :r2,
        required_scopes: %w[mcp:admin mcp:write],
        hitl_required: false,
        description: 'Rejeição de solicitação de governança'
      },
      'approval_snooze' => {
        risk_tier: :r2,
        required_scopes: %w[mcp:admin mcp:write],
        hitl_required: false,
        description: 'Snooze operacional de solicitação'
      },
      'approval_execute' => {
        risk_tier: :r3,
        required_scopes: %w[mcp:admin mcp:write],
        hitl_required: false,
        description: 'Execução durável de solicitação aprovada'
      }
    }.merge(RevenueToolRegistry.classifications).freeze

    class << self
      def classify(tool_name)
        tool_key = tool_name.to_s
        return prohibited_descriptor(tool_key) if prohibited?(tool_key)

        entry = CLASSIFICATION_CATALOG[tool_key]
        if entry
          entry.merge(prohibited: false)
        else
          # Fallback padrão seguro para tools desconhecidas
          {
            risk_tier: :r3,
            required_scopes: %w[mcp:admin],
            hitl_required: true,
            description: 'Ferramenta não catalogada (Classificação estrita R3)',
            prohibited: false
          }
        end
      end

      def prohibited?(tool_name)
        name = tool_name.to_s.downcase
        return true if PROHIBITED_TOOLS.include?(name)
        return true if name.match?(/(shell|bash|system_command|system_exec|eval_ruby|\beval\b)/)
        return true if name.match?(/(raw_sql|direct_sql|db_query|run_sql|\bsql\b|truncate_table|drop_database)/)

        false
      end

      def hitl_required?(tool_name, arguments = {})
        return false if prohibited?(tool_name)

        meta = classify(tool_name)
        return true if meta[:hitl_required]
        return true if [:r3, :r4].include?(meta[:risk_tier])

        # Exigência condicional por volumetria / argumentos
        if arguments.is_a?(Hash) && arguments[:force_hitl].present?
          return true
        end

        false
      end

      def required_scopes(tool_name)
        classify(tool_name)[:required_scopes] || %w[mcp:read]
      end

      def risk_tier(tool_name)
        classify(tool_name)[:risk_tier]
      end

      def compare_risk(tier_a, tier_b)
        val_a = RISK_LEVELS.fetch(tier_a.to_sym, 99)
        val_b = RISK_LEVELS.fetch(tier_b.to_sym, 99)
        val_a <=> val_b
      end

      def risk_within_limit?(tier, max_tier)
        compare_risk(tier, max_tier) <= 0
      end

      private

      def prohibited_descriptor(tool_name)
        {
          risk_tier: :r4,
          required_scopes: %w[mcp:forbidden],
          hitl_required: true,
          description: "Ferramenta proibida (#{tool_name})",
          prohibited: true
        }
      end
    end
  end
end
