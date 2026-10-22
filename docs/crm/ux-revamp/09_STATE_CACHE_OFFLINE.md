# 09 — Gerenciamento de Estado, Caching & Análise de Risco Offline

## 1. Separação de Responsabilidade de Estado

| Camada de Estado | Tecnologia | Responsabilidade no CRM | Política de Invalidação / Ciclo de Vida |
|------------------|------------|-------------------------|----------------------------------------|
| **Server State** | `@tanstack/react-query` v5 | Dados assíncronos do backend (Hoje, Contas, Contatos, Oportunidades, Timeline) | Invalidação seletiva por chaves canônicas (`salesKeys.accounts()`, `salesKeys.opportunity(id)`) após mutações bem-sucedidas. |
| **Client Memory Cache** | Map em `lib/api/sales/client.ts` | Cache de baixa latência em chamadas repetitivas | TTL de 60 segundos com suporte a purga manual (`clearSalesApiCache()`) em mutações. |
| **UI State Efêmero** | Zustand v5 / React State | Estado de modais abertos, abas ativas, rascunhos de formulário e filtros | Descartado no fechamento de tela ou logout; não sincronizado com backend. |
| **Offline Persistence** | Dexie / IndexedDB | Suporte a rotas públicas do marketplace | **Desativado para o CRM por padrão** devido a riscos de concorrência e privacidade. |

---

## 2. Análise de Risco da Fila Offline (`mutationQueue.ts`)

Conforme evidenciado na auditoria de código:
1. `lib/offline/config.ts` define `OFFLINE_SUPPORTED_ROUTES` cobrindo apenas rotas públicas (`/`, `/categories`, `/companies`, `/compare`). As rotas do CRM `/dashboard/sales/**` não constam e **não devem ser adicionadas sem mecanismos de idempotência estritos**.
2. O método `buildOfflineConflictKey()` gera chaves baseadas em `METHOD:URL`. Em operações comerciais (como criar duas ligações seguidas ou duas propostas), uma mutação offline pendente sobrescreveria a outra na fila, causando **perda silenciosa de dados comerciais**.
3. **Decisão:** O CRM deve operar no modelo **Online-First com Cache Resiliente**. Em caso de queda de conexão, o sistema sinaliza estado `offline-readonly`, permite consulta aos dados já carregados na sessão, mas bloqueia o salvamento de novas mutações com aviso claro, impedindo falsos sucessos.
