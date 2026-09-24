# Template de Homologação e Signoff Shadow (W15 / SHADOW-003)

- **Identificador da Rodada:** `SHADOW-RUN-YYYYMMDD-REV`
- **Data da Execução:** `YYYY-MM-DD`
- **Ambiente:** `Staging / Sanitized Read-Only Mirror`
- **Avaliador Responsável:** Tech Lead & Product Owner

---

## 1. Evidências Coletadas

- **Dataset Base:** [ ] Base espelho idêntica à produção sanitizada (sem PII)
- **Tamanho da Amostra:** `N` empresas avaliadas em `M` cidades-alvo
- **Relatório Bruto:** `artifacts/shadow_run_YYYYMMDD.json`

---

## 2. Checklist de Verificação de Tolerâncias

| Critério | Meta | Observado | Status |
|---|---|---|---|
| Drift na fórmula orgânica | `0.00%` | `0.00%` | [ ] APROVADO |
| Preservação de desempate | `0 posições` | `0 posições` | [ ] APROVADO |
| Raio como prova territorial no ranking | `0 ocorrências` | `0 ocorrências` | [ ] APROVADO |
| Falsos positivos legados explicados | 100% justificados por ausência de relação ativa | [ ] | [ ] APROVADO |
| Ausência de regressão em clientes legados | 100% | [ ] | [ ] APROVADO |

---

## 3. Justificativa de Divergências Identificadas

- **Divergências Tipo `legacy_false_positive`:**
  - *Causa Raiz:* Empresas com strings legadas de cidades em `coverage_cities` que nunca foram validadas ou cadastradas na tabela relacional `company_service_areas`.
  - *Impacto Comercial:* O modelo canônico confere maior autoridade e veracidade aos dados apresentados aos clientes finais.
- **Divergências Tipo `legacy_false_negative`:**
  - *Causa Raiz:* Empresas com cobertura nacional ativa (`coverage_type: 'national'`) que não tinham o nome de cidades específicas listado explicitamente na string de texto legado.

---

## 4. Assinatura e Liberação para Rollout Faseado

- [ ] Aprovado para Rollout na busca (`ENABLE_CANONICAL_COVERAGE_SEARCH`)
- [ ] Aprovado para Rollout no roteamento de leads (`ENABLE_CANONICAL_COVERAGE_LEADS`)
- [ ] Aprovado para Rollout no chat MobiVolt (`ENABLE_CANONICAL_COVERAGE_MOBIVOLT`)
- [ ] Aprovado para Rollout no ranking (`ENABLE_CANONICAL_COVERAGE_RANKING`)

**Assinaturas:**
- Engenharia: _______________________ Data: ___/___/______
- Produto: __________________________ Data: ___/___/______
