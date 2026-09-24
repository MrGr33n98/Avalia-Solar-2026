# Tolerâncias e Critérios de Aceitação Shadow (W15 / SHADOW-001)

- **Status:** Aprovado para Avaliação Shadow.
- **Objetivo:** Estabelecer os limites numéricos e operacionais estritos para aceitação de qualquer divergência detectada entre o pipeline legado e o Ranking v2 antes de qualquer cutover de consumidor.

---

## 1. Tabela de Tolerâncias de Divergência

| Métrica | Tolerância Máxima | Justificativa / Comportamento Esperado |
|---|---|---|
| **Drift de Score Orgânico** | `0.00%` | Para idênticos dados de entrada (`as_of` congelado), `Ranking::CompatibilityEngine` deve produzir exatamente a mesma nota matemática (35% Trust, 30% Projetos, 20% SLA, 15% Garantia). |
| **Drift de Posição / Empate** | `0 posições` | O critério determinístico de desempate por menor `company_id` assegura ordenação idêntica em qualquer reprocessamento. |
| **Divergência de População (Escopo Idêntico)** | `0 empresas` | Empresas elegíveis devem ser exatamente as mesmas quando nenhum filtro novo for aplicado. |
| **Erro de Ladder Fallback** | `0.00%` | O candidate ladder só pode acionar agregação para estado se a população municipal for estritamente menor que o threshold exigido. |
| **Exposição de Raio como Prova** | `0 ocorrências` | O `CoverageResolver` novo deve retornar invariavelmente `:unsupported` para qualquer empresa cujo único vínculo territorial seja raio geodésico não auditado. |
| **Taxa de Erro 5xx na API** | `< 0.05%` | O throughput da API não pode sofrer degradação com a adição dos metadados de manifest e escopo. |
| **Latência P95 da API** | `< 180ms` | A serialização aditiva em `CompanyDashboardController` deve manter o tempo de resposta do dashboard abaixo de 180ms. |

---

## 2. Protocolo de Bloqueio Automático (Stop-Ship)

Qualquer execução em modo shadow que apresentar:
1. Posições divergentes sem alteração comprovada no cadastro da empresa;
2. Qualquer vazamento de PII em logs de telemetria;
3. Qualquer bloqueio da nota orgânica decorrente da ausência de dados de benchmark/quadrante;

**Resultará no cancelamento imediato da janela de homologação e acionamento do comitê de engenharia.**
