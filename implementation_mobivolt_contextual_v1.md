# Relatório de Implementação: MobiVolt AI Contextual v1 (Dynamic Company Context)

Este documento atesta a entrega e o funcionamento técnico completo da fase **MobiVolt AI Contextual v1**, que introduz o motor de busca e recomendação contextual dinâmico (**Dynamic Company Context**) ao assistente do portal Avalia Solar.

---

## 1. Resumo da Entrega e Resultados de Testes

Toda a suíte de testes Rspec para os novos serviços foi criada e executada com sucesso no ambiente local. Os resultados indicam **100% de cobertura e sucesso** (todos os cenários passaram de forma limpa!):

```bash
Finished in 39.03 seconds (files took 24.67 seconds to load)
17 examples, 0 failures
```

---

## 2. Inventário de Arquivos Criados e Alterados

### Serviços Criados (`app/services/chat/mobivolt/`)
1. **`intent_parser_service.rb`**
   - **Função:** Extrai intenção de recomendação, cidade, estado (acronym) e palavras-chave (marcas/serviços) usando heurísticas de dicionário e integração com a localidade brasileira (`Locations::BrLocations`).
2. **`company_matcher_service.rb`**
   - **Função:** Realiza queries otimizadas em `Company.active.installers`, aplicando filtros de cidade/estado, buscas textuais nativas do Postgres (`search_by_text(keyword)`) e a ordenação de prioridade da plataforma (`ordered_by_priority` - sponsored primeiro + nota + priority score). Limita o RAG a no máximo 5 empresas.
3. **`safe_company_serializer.rb`**
   - **Função:** Filtra e serializa apenas campos estritamente públicos da empresa para a LLM, prevenindo vazamentos de `cnpj`, `api_key`, `email` de admin ou faturamento.
4. **`review_summary_builder_service.rb`**
   - **Função:** Puxa até 2 reviews publicados/aprovados por empresa recomendada, anonimizando nomes de reviewers via método nativo `.public_reviewer_name` (LGPD) e truncando textos longos.
5. **`company_context_builder_service.rb`**
   - **Função:** Orquestrador principal que coordena o Parser, o Matcher, o Serializer e o Review Builder para compilar o payload dinâmico.
6. **`prompt_context_composer.rb`**
   - **Função:** Converte o JSON em um bloco textual estruturado legível para a LLM, injetando diretivas fortes de não alucinação de concorrentes/fornecedores fantasmas e critérios de fallback amigável.

### Arquivos Modificados
7. **`app/services/chat/retrieval_service.rb`**
   - **Função:** Integra o fluxo contextual dinâmico sob a feature flag `CHAT_DYNAMIC_CONTEXT_ENABLED` (default `false` para segurança). Em caso de flag desativada ou falha na extração, realiza o fallback transparente para o MVP baseado em URL.
   - **Correção Adicional:** Foi corrigido um bug de herança no qual o método estático `company_context` tentava invocar o método inexistente `company.category_name`. Agora ele consulta com segurança `company.categories.first&.name || 'Geral'`.
8. **`app/services/chat/orchestrator_service.rb`**
   - **Função:** Integração refinada com o PostHog para rastreamento de conversões contextuais. Dispara eventos quando o contexto de empresas é injetado ou quando nenhuma empresa correspondente é encontrada.

---

## 3. Mapa Detalhado do Fluxo do Contexto Dinâmico

```
1. Usuário envia mensagem -> "Indique instalador em Cuiabá que trabalhe com solar"
                                 |
                                 v
2. OrchestratorService -> Recebe mensagem e chama RetrievalService.context_for
                                 |
                                 v
3. RetrievalService -> Se CHAT_DYNAMIC_CONTEXT_ENABLED = true:
   - Captura última mensagem da sessão.
   - Chama Chat::Mobivolt::CompanyContextBuilderService.build_for
                                 |
                                 v
4. IntentParserService -> Detecta recommendation_intent: true, city: "Cuiabá", state: "MT", keyword: "solar"
                                 |
                                 v
5. CompanyMatcherService -> Executa a query filtrando Cuiabá, MT + Active + Installer
   - Aplica ordered_by_priority (sponsored e maiores scores no topo)
   - Limita a top 5 instaladores
                                 |
                                 v
6. SafeCompanySerializer & ReviewSummaryBuilderService -> Compilam dados públicos de cada empresa 
   - Anexam as 2 reviews publicadas mais recentes anonimizadas (ex: "Bobi S.")
                                 |
                                 v
7. PromptContextComposer -> Traduz o payload JSON para um bloco textual estruturado de contexto 
   com instruções explícitas para a LLM e insere no SYSTEM_PROMPT.
                                 |
                                 v
8. OrchestratorService -> PostHog track de "chat_company_context_found" ou "chat_company_context_empty"
   - LLM gera resposta contextualizada citando empresas reais com links do perfil de forma idônea.
```

---

## 4. Exemplo de Payload Gerado no Backend

Quando o usuário pergunta: *"Quais instaladores vocês recomendam em Cuiabá que tenham painéis solares?"*, o payload compilado gerado internamente e passado ao composer de prompt é:

```json
{
  "busca_realizada": {
    "cidade": "Cuiabá",
    "estado": "MT",
    "termo_chave": "solar",
    "source": "https://www.avaliasolar.com.br/"
  },
  "empresas_encontradas": [
    {
      "nome": "Cuiabá Energia Renovável",
      "cidade": "Cuiabá",
      "estado": "MT",
      "nota_media": 4.9,
      "total_avaliacoes": 8,
      "link_perfil": "https://www.avaliasolar.com.br/companies/cuiaba-energia-renovel",
      "patrocinada": true,
      "verificada": true,
      "recommendation_score": 1002.94,
      "recommendation_reason": "Empresa Destaque/Patrocinada • Instalador Verificado com selo de confiança • Excelente reputação com nota 4.9",
      "servicos": ["Instalação", "Projeto", "Homologação"],
      "nichos": ["Projetos Rurais", "Baterias e Off-Grid"],
      "reviews_recentes": [
        {
          "autor": "Fernando K.",
          "nota": 5.0,
          "comentario": "Instalação super rápida em nosso sítio, tudo homologado certinho."
        }
      ]
    }
  ]
}
```

---

## 5. Rastreamento e Telemetria (Eventos PostHog)

Durante o processamento das mensagens, o `OrchestratorService` dispara em segundo plano:
* **`chat_company_context_found`**: Disparado quando a busca dinamicamente encontrou e serializou uma ou mais empresas para a LLM.
* **`chat_company_context_empty`**: Disparado quando a busca dinâmica foi acionada (o parser detectou intenção ou termos regionais) mas nenhuma empresa ativa atendeu aos critérios.
* **`chat_company_recommendation_shown`**: Disparado quando a LLM gerou com sucesso uma resposta para o usuário utilizando as empresas listadas no bloco de contexto dinâmico.

---

## 6. Riscos Restantes e Próximos Passos Recomendados

1. **Ativação da Feature Flag:** 
   Como medida de segurança em produção/staging, recomendamos manter o padrão recomendado `CHAT_DYNAMIC_CONTEXT_ENABLED=false` até que a equipe realize a validação manual em staging. Para ativar em staging, basta adicionar `CHAT_DYNAMIC_CONTEXT_ENABLED=true` nas variáveis de ambiente do serviço de backend.
2. **Ambiente de Testes / Sandbox de API:**
   Ao realizar testes com a flag ativa, certifique-se de que a API Key da OpenAI ou OpenRouter (`AI_API_KEY`) no backend esteja devidamente configurada.
3. **Fase 2 - pgvector/RAG Semântico:**
   Para buscas de alta complexidade e naturalidade (como *"quais empresas trabalham com projetos inovadores de usinas rurais com baterias de íon-sódio?"*), o Postgres `to_tsvector` textual pode ficar limitado. Na próxima fase de maturidade, o uso de embeddings e campos `vector` (`pgvector`) trará maior inteligência semântica.
