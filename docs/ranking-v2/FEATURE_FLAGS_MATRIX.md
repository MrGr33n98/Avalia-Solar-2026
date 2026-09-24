# Matriz de Feature Flags e Governança de Rollout (W16 / ROLL-001)

- **Status:** Ativo e Mapeado.
- **Princípio:** Nenhuma mudança entra em produção ativada por padrão (`default: false`). Cada consumidor tem desacoplamento total.

---

## 1. Tabela de Feature Flags por Consumidor

| Nome da Variável / Flag | Consumidor Afetado | Padrão | Read Path Padrão (Off) | Read Path Canônico (On) | Proprietário | Expiração Prevista |
|---|---|---|---|---|---|---|
| `ENABLE_COVERAGE_SHADOW_LOG` | Todos | `false` | Sem logging shadow | Executa comparador e loga diffs amostrados | Tech Lead | 30 dias após GA |
| `ENABLE_CANONICAL_COVERAGE_LEADS` | Roteamento de Leads | `false` | `company.serves_city?` (legado) | `CoverageResolver.resolve` | Growth / Leads | 60 dias após GA |
| `ENABLE_CANONICAL_COVERAGE_MOBIVOLT` | Chat IA MobiVolt | `false` | Sede + `coverage_city_list` | `CoverageResolver.resolve` | AI Team | 60 dias após GA |
| `ENABLE_CANONICAL_COVERAGE_SEARCH` | Busca de Empresas | `false` | `CompanySearchService` legado | Canônico via `CoverageResolver` | Core Platform | 60 dias após GA |
| `ENABLE_CANONICAL_COVERAGE_RECOMMENDATION` | Motor de Recomendação | `false` | Queries SQL existentes | `CoverageResolver` ativo | Growth | 60 dias após GA |
| `ENABLE_CANONICAL_COVERAGE_SEO` | Páginas Locais SEO | `false` | `serving_city_strict` (legado) | Resolução canônica de território | SEO Team | 90 dias após GA |
| `ENABLE_CANONICAL_COVERAGE_ALL` | Master Switch Global | `false` | Respeita flags individuais | Força todos os consumidores para canônico | CTO | 120 dias após GA |

---

## 2. Invariante Imutável

As feature flags controlam **exclusivamente** o caminho de leitura dos consumidores. Elas **nunca**:
1. Alteram fórmulas matemáticas ou coeficientes do ranking;
2. Modificam o `parameter_digest` do `MethodologyManifest`;
3. Apagam dados históricos ou tabelas legadas.
