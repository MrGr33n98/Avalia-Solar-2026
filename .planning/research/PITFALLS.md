# Pitfalls do Domínio: Mobile Solar

**Domínio:** Mobile (Expo/React Native)
**Pesquisado em:** 17/06/2026

## Pitfalls Críticos

Erros que podem causar reescritas ou problemas graves de UX.

### Pitfall 1: Inconsistência de Real-time (O "Falso Real-time")
**O que acontece:** O uso de Polling em `/chat` dá uma experiência degradada comparado ao WebSocket em `/p2p_chat`. Além disso, se o usuário alternar entre as telas, ele pode ver mensagens faltando ou duplicadas se os caches não estiverem sincronizados.
**Causa raiz:** Mudança de arquitetura no meio do projeto sem limpeza do código antigo.
**Consequências:** Usuários perdem confiança na ferramenta de comunicação; aumento do consumo de dados.
**Prevenção:** Unificar o chat em um único provider de WebSocket logo no início da Fase 1.

### Pitfall 2: Bleeding Edge Instability
**O que acontece:** O uso de React Native 0.85 e Apollo 4.2 (versões futuras/não estáveis na prática atual) pode quebrar bibliotecas comunitárias que dependem de internals do RN (como `react-native-maps`).
**Prevenção:** Executar uma bateria de testes de regressão em dispositivos físicos (Android e iOS) focada em componentes nativos.

## Pitfalls Moderados

### Pitfall 1: Vazamento de Token em Logs
**O que acontece:** O `api.ts` loga URLs completas. Se o token for passado via Query Param (comum em WebSockets no início), ele pode vazar em logs de monitoramento.
**Prevenção:** Sanitizar logs de requisição para remover headers sensíveis e parâmetros de autenticação.

## Pitfalls Menores

### Pitfall 1: Persistência de Cache Ilimitada
**O que acontece:** O cache do Apollo persiste no `AsyncStorage`. Sem uma estratégia de expiração, ele pode crescer indefinidamente, ocupando gigabytes de espaço no celular do usuário.
**Prevenção:** Configurar limites de tamanho no `apollo3-cache-persist` ou limpar o cache no logout.

## Avisos por Fase

| Tópico da Fase | Pitfall Provável | Mitigação |
|-------------|---------------|------------|
| Chat | Mensagens "fantasm" (enviadas mas não aparecem). | Implementar UUIDs gerados no cliente para deduplicação no backend. |
| Dashboard | Lentidão ao carregar muitos leads. | Usar `FlatList` com `windowSize` otimizado e paginação via GraphQL. |
| Localização | Precisão baixa do GPS em ambientes internos. | Adicionar fallback para seleção manual de cidade/estado (já presente em `select-city.tsx`). |

## Fontes
- Análise de código em `src/lib/api.ts` e `src/app/chat/`.
- Documentação de requisitos `.planning/REQUIREMENTS.md`.
- Boas práticas de Expo e React Native.
