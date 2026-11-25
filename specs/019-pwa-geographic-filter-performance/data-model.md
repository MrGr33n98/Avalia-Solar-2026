# Data model e cache

Conceitos distintos: (1) taxonomia oficial, (2) presença de empresas cadastradas/elegíveis, (3) sede declarada, (4) cobertura declarada de atendimento. GPS é apenas entrada opcional de localização. Não inferir cobertura a partir de sede sem respeitar regra de negócio atual.

`UF`: sigla canônica uppercase; validar contra catálogo. `OfficialCity`: identidade do catálogo existente (código, quando disponível), nome de exibição, UF. `CatalogRevision`: digest SHA256 de conteúdo canônico, não timestamp aleatório. `FilterCriteria`: filtros completos normalizados, ordenados apenas quando a ordem for semanticamente irrelevante. Não inventar código IBGE se fonte não o fornece.

Chaves propostas: `['geo','official-cities',uf,revision]`, `['geo','official-states',revision]`, `['companies','count',normalizedCriteria]`. Persistência por UF: `avalia_solar_geo_v3:<UF>` com `schemaVersion`, `revision`, `fetchedAt`, `expiresAt`, `data`; validar antes de consumir. Diferenciar versão de schema e conteúdo. Em storage indisponível, usar QueryClient. Expiração 24h inicial, GC 7d, revalidação deduplicada. Nunca tratar dados expirados de outra UF como placeholder.

Retenção e limpeza: limite de tamanho/entradas (até catálogo de 27 UFs), limpar versões antigas de namespace próprio de forma seletiva; não usar localStorage.clear(). No offline, dados expirados podem ser servidos somente como stale explicitamente sinalizado quando a política permitir. A busca de empresas permanece sujeita à conexão.
