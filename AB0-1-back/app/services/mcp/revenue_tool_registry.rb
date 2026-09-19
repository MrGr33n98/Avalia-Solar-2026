# frozen_string_literal: true

module Mcp
  class RevenueToolRegistry
    def self.contract(description, risk_tier, required_scopes, requires_approval = false)
      {
        description: description,
        input_schema: { type: 'object', additionalProperties: true },
        output_schema: { type: 'object' },
        risk_tier: risk_tier,
        required_scopes: required_scopes,
        tenant_context: 'required',
        approval_policy: requires_approval ? 'required' : 'not_required',
        idempotency_policy: risk_tier == :r2 ? 'required_for_create' : 'not_applicable',
        audit_policy: 'structured_audit'
      }
    end

    private_class_method :contract

    CONTRACTS = {
      'revenue_search_accounts' => contract('Busca contas do CRM no tenant atual.', :r0, %w[mcp:read]),
      'revenue_get_account_context' => contract('Retorna contexto de CRM e pesquisa registrada para uma conta.', :r0,
                                                %w[mcp:read]),
      'revenue_find_prospects' => contract('Lista prospects reais sem criar registros.', :r0, %w[mcp:read]),
      'revenue_research_prospect' => contract('Resume fatos, incertezas e proveniência de um prospect.', :r0,
                                              %w[mcp:read]),
      'revenue_list_research_records' => contract('Lista registros de pesquisa com proveniência.', :r0, %w[mcp:read]),
      'revenue_get_decision_committee' => contract('Consulta contatos e papéis de comitê já registrados.', :r0,
                                                   %w[mcp:read]),
      'revenue_list_opportunities' => contract('Lista oportunidades pertencentes ao tenant.', :r0, %w[mcp:read]),
      'revenue_get_opportunity_context' => contract('Retorna contexto de uma oportunidade e sua qualificação.', :r0,
                                                    %w[mcp:read]),
      'revenue_prioritize_opportunities' => contract('Calcula prioridade explicável com dados existentes.', :r1,
                                                     %w[mcp:analyze]),
      'revenue_list_due_followups' => contract('Lista follow-ups internos pendentes.', :r0, %w[mcp:read]),
      'revenue_get_founder_inbox' => contract('Consulta a fila operacional do Founder Inbox.', :r0, %w[mcp:read]),
      'revenue_get_pipeline_metrics' => contract('Consulta métricas reais do pipeline.', :r0, %w[mcp:read]),
      'revenue_get_growth_metrics' => contract('Consulta métricas reais e identifica dados não instrumentados.', :r0,
                                               %w[mcp:read]),
      'revenue_list_audiences' => contract('Lista audiências tenant-scoped.', :r0, %w[mcp:read]),
      'revenue_preview_audience' => contract('Pré-visualiza audiência sem disparar campanha.', :r0, %w[mcp:read]),
      'revenue_get_campaign_context' => contract('Retorna contexto e preflight de uma campanha.', :r0, %w[mcp:read]),
      'revenue_preview_campaign' => contract('Executa preflight sem enviar mensagens.', :r1, %w[mcp:analyze]),
      'revenue_prepare_followup' => contract('Prepara próximo passo comercial sem contatar destinatários.', :r1,
                                             %w[mcp:analyze]),
      'revenue_prepare_email' => contract('Prepara contexto factual para rascunho de e-mail.', :r1, %w[mcp:analyze]),
      'revenue_prepare_content_brief' => contract('Prepara brief de conteúdo com fatos e proveniência.', :r1,
                                                  %w[mcp:analyze]),
      'revenue_prepare_social_post' => contract('Prepara insumos de post sem publicar.', :r1, %w[mcp:analyze]),
      'revenue_register_prospect' => contract('Registra prospect com fonte e idempotência.', :r2, %w[mcp:write]),
      'revenue_record_qualification_assessment' => contract('Registra assessment separado de fatos do CRM.', :r2,
                                                            %w[mcp:write]),
      'revenue_create_internal_task' => contract('Cria tarefa interna idempotente.', :r2, %w[mcp:write]),
      'revenue_refresh_founder_inbox' => contract('Atualiza itens internos deduplicáveis do Founder Inbox.', :r2,
                                                  %w[mcp:write]),
      'revenue_prepare_campaign' => contract('Cria somente rascunho de campanha e executa preflight.', :r2,
                                             %w[mcp:write]),
      'revenue_request_campaign_send' => contract('Solicita disparo por dispatcher canônico após HITL.', :r3,
                                                  %w[mcp:external_mutate], true)
    }.freeze

    class << self
      def entries
        CONTRACTS.each_with_object({}) do |(name, contract), entries|
          entries[name] = {
            service: Mcp::RevenueToolService,
            access: :company,
            contract: contract.merge(name: name)
          }
        end
      end

      def classifications
        CONTRACTS.transform_values do |contract|
          {
            risk_tier: contract[:risk_tier],
            required_scopes: contract[:required_scopes],
            hitl_required: contract[:approval_policy] == 'required',
            description: contract[:description]
          }
        end
      end
    end
  end
end
