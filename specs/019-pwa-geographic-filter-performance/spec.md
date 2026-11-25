# Spec 019 — PRD | Geographic Filter Performance
Status: proposta para execução controlada. Prioridade P0/P1. Base: auditoria forense fornecida.

## Objetivo
Permitir que o consumidor escolha UF e cidade sem latência artificial, com dados corretos sob concorrência, compartilhados em toda a plataforma e com degradação segura. Preservar densidade, URL, SEO e filtros atuais.

## Não objetivos
Redesign de navegação, alteração de ranking, mudança de semântica de cobertura sem aprovação, aquisição de infraestrutura, geolocalização compulsória, cache público de dados autenticados, refatoração do MCP. Não inserir catálogo completo no JS crítico.

## Histórias de usuário
| ID | Prioridade | História | Aceite |
|---|---|---|---|
| US01 | P0 | Como consumidor, quero selecionar UF e ver cidades sem espera artificial | Cache imediato; miss sinalizado no próximo frame; nenhuma cidade de outra UF |
| US02 | P0 | Quero alternar SC → MT → SP rapidamente | Apenas SP pode renderizar no final, mesmo que SC chegue depois |
| US03 | P1 | Quero fechar e reabrir o filtro ou navegar entre páginas | Cache válido compartilhado, zero fetch redundante e draft conforme contrato existente |
| US04 | P1 | Quero encontrar uma cidade de SP/MG rapidamente no desktop | Busca local sem acentos, janela controlada e teclado funcional |
| US05 | P1 | Quero entender quando não há conexão ou ocorreu erro | Cache válido quando disponível; estado de erro com retry acessível; sem dados de outra UF |
| US06 | P1 | Quero filtrar empresas pela sede ou atendimento corretamente | Preservar parâmetros e regras de cobertura; município oficial não implica disponibilidade |
| US07 | P1 | Quero ver uma contagem coerente antes de aplicar | Última consulta vence; falha não bloqueia aplicação; zero não equivale a erro |
| US08 | P2 | Quero utilizar o filtro já visitado offline | Cache versionado; nenhuma promessa de pesquisa de empresas offline |
| US09 | P1 | Quero usar o filtro com teclado ou leitor de tela | Foco, labels, estados e navegação sem regressão |

## Requisitos funcionais
- FR01 — Catálogo oficial: 27 UFs e quantidade de municípios conforme artefato canônico versionado (baseline 5.569). Teste paridade, sem assumir que o número nunca muda.
- FR02 — Normalizar UF, validar entradas, distinguir UF não selecionada, inválida e resultado vazio.
- FR03 — Usar um núcleo `useGeographyCatalog` e adaptadores compatíveis para os três hooks existentes; nenhuma segunda implementação de rede/cache.
- FR04 — Ler cache válido antes de qualquer timer; remover debounce de seleção discreta e throttle 500 ms.
- FR05 — Chaves por UF e versão; deduplicação de requisições simultâneas; cancelamento via AbortSignal sem cancelar outro consumidor ativo indevidamente; proteção contra resposta obsoleta.
- FR06 — Ao trocar UF, limpar cidade incompatível e opções antigas no mesmo update; preservar cidade válida segundo contrato atual.
- FR07 — Prefetch somente da UF ativa após hidratação/idle ou intenção de abrir filtro; respeitar Save-Data, rede lenta e ausência de seleção. Não fazer prefetch de 27 UFs indiscriminadamente.
- FR08 — Persistência versionada, TTL, validação de formato e fallback para memória quando storage indisponível/corrompido. Não persistir GPS ou dados pessoais.
- FR09 — Preservar múltiplas UFs no desktop: cidades identificadas pelo par UF/cidade ou código existente; ordenação estável, dedup correta e cidades homônimas distintas.
- FR10 — Contagem sob queryKey de filtros normalizados, debounce apenas para alterações de draft que realmente mudam a contagem, cancelamento de respostas obsoletas, fallback no máximo uma vez quando aplicável; `Ver empresas` se indisponível.
- FR11 — Aplicação/cancelamento/limpeza e navegação por URL preservam contratos de filtros, paginação e histórico. Não fazer geolocalização automática adicional.
- FR12 — Cache HTTP de taxonomia exclusivamente pública, por whitelist exata; validadores ETag/304; invalidar por revisão do catálogo.
- FR13 — Pré-aquecer catálogo Rails antes de readiness e fora da primeira request; confirmar estratégia Puma e memória.
- FR14 — Localizações de empresas ativas, distinguindo catálogo oficial, presença cadastral, sede e cobertura declarada; não tratar cobertura como sede. Contagens/facetas dinâmicas têm cache e política próprios.
- FR15 — Desktop: componente estável, busca local accent-insensitive e janela de opções acessível. Preservar comportamento de multi-select.
- FR16 — Estados idle, loading, success, empty, error, stale/offline; retry explícito; não cachear erros ou interpretar cancelamento como falha.
- FR17 — SW isolado para taxonomia pública, ativação independente ou subordinada a flag verificada; atualização e limpeza apenas do cache próprio; não alterar outros caches.
- FR18 — Instrumentar eventos agregados sem cidade digitada, GPS, cookies, e-mail, identificadores pessoais ou texto livre; respeitar consentimento no analytics client.
- FR19 — Remover chamadas internas a `/states/:id/cities` e estabilizar callbacks. Manter aliases externos existentes quando necessários.
- FR20 — Garantir paridade de filtros, paginação e autorização para `/count` e listagem; não alterar comportamento de consumidores externos/MCP sem teste de contrato.

## Requisitos não funcionais / SLOs propostos
| ID | Métrica | Gate |
|---|---|---|
| NFR01 | Leitura/disponibilização em cache quente | p95 ≤5 ms em benchmark de referência; sem timer fixo |
| NFR02 | Troca UF → opções pintadas em cache | p95 ≤50 ms; feedback no próximo frame (meta ≤16 ms) |
| NFR03 | TTFB Rails primeiro hit após readiness | ≤100 ms no ambiente de referência; registrar custo de boot |
| NFR04 | TTFB rede quente | p95 ≤150 ms em perfil de referência; CDN HIT ≤50 ms aspiracional, não promessa universal |
| NFR05 | Redundância | 0 GETs adicionais por UF/revisão válida na sessão; revalidação expirada/retry manual não contam |
| NFR06 | Concorrência | 0 opções obsoletas em 100 sequências automatizadas |
| NFR07 | Payload por UF | ≤5 KB gzip como meta; medir todas as UFs e justificar eventual exceção |
| NFR08 | Bundle inicial | delta ≤5 KB gzip por rota crítica; catálogo não embutido |
| NFR09 | Lista desktop | ≤60 opções montadas simultaneamente (inclui overscan); acessibilidade comprovada |
| NFR10 | CWV | LCP ≤2,5s, INP ≤200ms, CLS ≤0,1 p75 em campo quando amostra suficiente; comparar baseline em lab |
| NFR11 | Cache edge | ≥95% HIT em tráfego elegível aquecido, quando CDN ativada, com amostra declarada |
| NFR12 | Segurança | 0 respostas privadas em cache compartilhado; zero cache de 4xx/5xx |
| NFR13 | Geometria | barra 44px ±1, 4 colunas, drawer 70vw ±1px; sem overflow horizontal em 320/375/390/430; desktop/tablet inalterados |
| NFR14 | Testes | novos testes 100% verdes, sem --forceExit; sem regressões novas nas suites existentes |
| NFR15 | Infra | sem novo OOM/restart atribuível à mudança; comparar RSS/PSS e readiness; sem aumento de recursos contratado |

## Métricas de produto (não gates de merge)
Medir baseline e 7/28 dias após rollout, com denominador e tamanho amostral: taxa abertura→aplicação; abandono do drawer; tempo até aplicar; sucesso de filtro; CTR de perfis a partir de busca filtrada. Metas exploratórias: +10% relativo em aplicação, -20% relativo em abandono, -30% p95 de tempo até aplicar. Não atribuir causalidade sem experimento ou controle de sazonalidade.
