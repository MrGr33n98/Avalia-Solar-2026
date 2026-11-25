# Gates de aceite
| ID | Gate | Medida objetiva |
|---|---|---|
| AC01 | Regressão funcional | 5 superfícies e fluxos baseline passam; diferenças aprovadas |
| AC02 | Compatibilidade | React18/Vite/Rails preservados; zero migração colateral; deps justificadas |
| AC03 | Bundle | cada HTML ≤122880 B gzip, manifest hash correto; zero novos processos VM |
| AC04 | UX/a11y | zero overflow página, axe serious/critical zero, keyboard/focus/zoom/reduced motion, 8 larguras e 2 temas |
| AC05 | Dados | IDs estáveis, null/unknown sem invenção, pt-BR, origem/limites, zero fixtures no runtime produtivo |
| AC06 | Fluxos | filtros preservados, cursor correto, 2–3 comparação, respostas stale não sobrescrevem |
| AC07 | Registry | itens MVP catalogados, 3 instalações em sandbox, docs/props/estados/tokens e licenças |
| AC08 | Contrato | envelope v1 exato, _meta/fallback/URIs/flags compatíveis, Profile V2 documentado |
| AC09 | Segurança | testes negativos, nenhuma tool privada pública, CSP sem ampliação não aprovada, mutações não introduzidas |
| AC10 | Hosts | harness verde; real host validado ou marcado BLOCKED antes de release; modo fallback testado |
| AC11 | Evidência | SHAs e relatórios por wave; REA limitações explícitas, nenhum segredo/source map publicado |
| AC12 | Entrega | draft PR, CI, rollback documentado e drill staging antes de produção |

Cada gate deve ter status PASS/FAIL/BLOCKED/NOT RUN, evidência e executor. Todos gates obrigatórios verdes para produção; se Claude não for host-alvo suportado, documentar isso em vez de alegar compatibilidade. W8+ exige novos critérios e aprovação.
