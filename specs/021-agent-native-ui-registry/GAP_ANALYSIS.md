# Gaps e causas candidatas
| ID | Observação | Hipótese / impacto | Ação | Gate |
|---|---|---|---|---|
| G01 | Tokens/primitives CSS existentes sem registry identificado | Reuso difícil entre agentes | Registry e docs | AC07 |
| G02 | React18 vs upstream React19/Tailwind4 | Dependências incompatíveis/bundle | Port seletivo | AC02 |
| G03 | Product List defaults e índices | Dados falsos/seleção errada após reorder | IDs e fixture-only | AC05 |
| G04 | Search usa cidade apenas quando q/UF/cat ausentes | Cidade pode cair na refiltragem; reproduzir | Estado de filtros explícito | AC06 |
| G05 | fallback query solar | Pode restringir universo; reproduzir semântica | Empty state / contrato válido | AC06 |
| G06 | Compare CSS min-width 420px | Scroll interno em viewport pequeno | Wrapper acessível, sticky opcional | AC04 |
| G07 | v2 usa mesmo HTML v1 | Ambiguidade de versão/manifest | Testar resolução URI, documentar | AC08 |
| G08 | Categories gzip 122680 B reportado | Margem 200 B | Redução antes de dependências | AC03 |
| G09 | REA timeout e semântica não examinada | Diagnóstico não conclusivo | Harness e análise fonte/CI | AC11 |
| G10 | Map/quote não identificados | Novas permissões/contratos | Deferred, specs separadas | AC09 |
| G11 | Host real não testado no relatório | Harness não representa toda interoperabilidade | Smoke real | AC10 |
| G12 | SourceNote sem ledger público comprovado | Limites de proveniência | Não criar IDs artificiais; integrar 020 quando existir | AC05 |
| G13 | Container `.as-frame` é também alvo de query | Container não estiliza a si próprio pela própria query; verificar CSS computado | Wrapper container externo/elemento interno | AC04 |

As causas são hipóteses quando não reproduzidas. W0 coleta passos, versão, expectativa, observado, contra-evidência e raiz. Nunca confundir scan estático com bug confirmado em produção.
