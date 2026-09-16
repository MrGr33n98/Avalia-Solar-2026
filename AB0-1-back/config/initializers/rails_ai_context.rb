# frozen_string_literal: true

# Configuração do Rails AI Context para Avalia Solar 2026
# Este inicializador ativa o servidor MCP STDIO apenas no ambiente de desenvolvimento.

if Rails.env.development? && defined?(RailsAiContext)
  RailsAiContext.configure do |config|
    # Modo de operação: MCP (STDIO Server)
    config.tool_mode = :mcp

    # Preset de ferramentas ativas: Full (inclui schema, models, routes, controllers, specs, runtime)
    config.preset = :full

    # Ativar regras estritas contra alucinações (anti-hallucination rules)
    config.anti_hallucination_rules = true

    # Regras customizadas específicas do Avalia Solar 2026
    avalia_rules = [
      "1. Nunca criar migration antes de consultar o schema e o runtime real do banco de dados.",
      "2. Nunca assumir colunas inexistentes nos models Rails.",
      "3. Nunca assumir associações sem validar os relacionamentos declarados em app/models/.",
      "4. Sempre verificar tenant ownership (Company / Sales Scope) em operacoes relacionadas a Sales::*.",
      "5. Nunca criar associacoes cross-tenant.",
      "6. Verificar inherited controller filters ao inspecionar controllers ou rotas.",
      "7. Reconsultar o contexto da aplicacao apos edicoes.",
      "8. Nunca inventar feature flags, plan features ou metricas.",
      "9. rails-ai-context NUNCA deve ser executado ou apontar para o ambiente de produção.",
      "10. DBHub é a fonte de verdade para PostgreSQL estrutural.",
      "11. rails-ai-context é a fonte de verdade para a aplicação Rails.",
      "12. GitHub MCP é a fonte de evidência de código e CI.",
      "13. Playwright é a fonte de evidência do browser e testes E2E."
    ]

    if config.respond_to?(:custom_rules=)
      config.custom_rules = avalia_rules
    elsif config.respond_to?(:custom_instructions=)
      config.custom_instructions = avalia_rules.join("\n")
    end
  end
end
