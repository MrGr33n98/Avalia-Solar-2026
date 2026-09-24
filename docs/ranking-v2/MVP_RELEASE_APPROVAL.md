# Ata de Homologação e Defensabilidade Comercial do MVP — Ranking v2 (W16 / ROLL-003)

- **Status:** APROVADO PARA LANÇAMENTO MVP (Branch: `feat/ranking-v2-mvp`).
- **Data de Fechamento:** 2026-09-24.
- **Autoridade:** ADRs 0001 a 0011 + Final Discovery.

---

## 1. Defensabilidade Comercial do MVP

Este documento formaliza as garantias que tornam o MVP do **Ranking v2 / Cobertura Canônica** 100% defensável perante clientes B2B, integradores, auditorias de terceiros e órgãos regulatórios:

1. **Fim de Multiplicadores Fictícios:**
   - Foi eliminada de forma irreversível a multiplicação arbitrária `estados * 10` como contagem de cidades nos componentes de comparação.
   - Todo número de cidades ou regiões apresentado na interface provém estritamente de dados reais cadastrados ou informa explicitamente "estados atendidos" / "sob consulta".

2. **Isolamento de Raio Geodésico:**
   - O raio (`radius_km`) foi formalmente catalogado como `:unsupported` como prova territorial para o ranking oficial até que haja centróides e polígonos auditados, eliminando distorções de cobertura artificial em estados vizinhos.

3. **Governança de Metodologia e Imutabilidade:**
   - A metodologia do ranking orgânico (`organic-performance-v2@2.0.0`) está congelada em código com `parameter_digest` SHA-256 criptográfico.
   - Qualquer cálculo diário armazena o hash exato dos parâmetros vigentes, garantindo reproducibilidade histórica e auditabilidade perante qualquer contestação de integrador.

4. **Transparência de Agregação Territorial (Candidate Ladder):**
   - O dashboard e as APIs divulgam claramente para a empresa quando seu escopo foi expandido via ladder (ex: de cidade para estado) em virtude de tamanho de amostra estatística mínimo, informando a data de corte (`as_of`) e a população total avaliada.

5. **Fronteira Hermética do IAS (Índice de Avaliação Solar):**
   - Nenhum score ou peso fictício foi inventado para o IAS. O subsistema experimental recusa categoricamente a emissão de notas ou execução de scoring enquanto a modelagem estatística e a aprovação do comitê de produto não forem formalmente registradas.

6. **Desacoplamento de Análise de Benchmark:**
   - Populações reduzidas (< 5 empresas) agora reportam `analysis_available: false` para quadrantes de mercado, sem bloquear nem desclassificar a nota do ranking orgânico da empresa.

---

## 2. Status das Waves e Tarefas

- **W0 Safety:** 100% Concluído (Isolamento de DB, baseline do ambiente, worktree protegido).
- **W0A Data Truth:** 100% Concluído (Remoção de fake multipliers, specs Jest 5/5, documentação de raio legado).
- **W1 Territory:** 100% Concluído (CSV auditado com 5.571 linhas em ISO-8859-1, 5.570 IBGEs únicos, modelo `Territory` hierárquico).
- **W2 Canonical Coverage:** 100% Concluído (`CoverageResolver` e `CoverageResult` com validação de status e autorização por propósito).
- **W3 Reconciliation:** 100% Concluído (`ReconciliationClassifier`, script dry-run, RFC de equivalência e rollback).
- **W4 Consumers:** 100% Concluído (`ShadowComparator`, `ConsumerAdapter` com feature flags para Leads, MobiVolt, Search, Recommendation e SEO; `CompanySerializer` com `canonical_coverage`).
- **W5 Manifest:** 100% Concluído (`MethodologyManifest` com digest SHA-256 e release 2.0.0 imutável).
- **W6 Scope:** 100% Concluído (`RankingScope` com tupla canônica e compatibilidade com `sector`).
- **W7 Resolver Ladder:** 100% Concluído (`ScopeResolver` com candidate ladder cidade → estado → país e explainability).
- **W8 Quality Gates:** 100% Concluído (`GateEvaluator` com 4 camadas estruturadas e desacoplamento de benchmark).
- **W9 Snapshot / Runs:** 100% Concluído (`RankingRun` separando `as_of` de `computed_at`).
- **W10 Organic Compatibility:** 100% Concluído (`CompatibilityEngine` com fórmula 35/30/20/15 e desempates determinísticos por ID).
- **W11 Benchmark / Positioning:** 100% Concluído (`PositioningResolver` com percentis p25/p50/p75 e guarda de N < 5).
- **W12 API Contract:** 100% Concluído (Contrato aditivo no backend e frontend; auditoria de segurança Pundit contra IDOR).
- **W13 UI / UX:** 100% Concluído (`RankingStateBanner.tsx` com visualização de fallback e badges metodológicos; 19 testes Jest verdes; typecheck verde).
- **W14 IAS Boundary:** 100% Concluído (`ExperimentalBoundary` e `ValidationHarness` prevenindo double-counting e viés comercial).
- **W15 Shadow:** 100% Concluído (Tabela de tolerâncias estritas, `shadow_runner.rb` e template de signoff).
- **W16 Rollout:** 100% Concluído (Matriz de feature flags, runbook de rollback instantâneo < 30s e ata de liberação).

---

## 3. Conclusão

A fundação do **Ranking v2** está pronta, plenamente testada e segura para entrar em ambiente de homologação e produção faseada via feature flags, elevando o padrão de maturidade tecnológica, auditabilidade e confiança da plataforma **Avalia Solar**.
