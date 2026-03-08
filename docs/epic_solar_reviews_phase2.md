# Epic: Solar Reviews 2.0 - Foundation & Data Engineering (Fase 2)

## Contexto
Transformar as reviews atuais em mini-cases editoriais (B2B Stack style) mantendo compatibilidade legada e amadurecendo o sistema de score granular existente.

## Objetivos Técnicos (Fase 2)
1. **Schema Expansion**: Adicionar campos editoriais (`headline`, `pros`, `cons`, `buyer_tip`, `project_type`, `estimated_power`) à tabela `reviews`.
2. **Taxonomia de Critérios**: Mapear a tabela `rating_criteria` para a nova taxonomia (Residencial, Comercial, etc.).
3. **Contrato de API (JSON)**: Definir a estrutura de saída unificada que inclua score principal, scores granulares e metadados editoriais.
4. **Lógica de Agregação**: Refinar o cálculo do `total_score` baseado em pesos por critério, garantindo fallback para reviews sem critérios.
5. **Telemetria**: Implementar track de eventos de leitura e clique em CTAs (baseado em `AnalyticsEvent`).

## Entregáveis Esperados
- [ ] Documento de Arquitetura (ADR) detalhando o novo schema e contratos.
- [ ] Migrações de Banco de Dados (Rails).
- [ ] Atualização dos Modelos (`Review`, `RatingCriterion`, `ReviewCriterionScore`).
- [ ] Spec de API para o Frontend (Solar Reviews 2.0).
- [ ] Plano de Migração de Dados Legados.

## Restrições
- Não alterar abas do ActiveAdmin.
- Manter compatibilidade com `Review.rating` (decimal 1-5).
