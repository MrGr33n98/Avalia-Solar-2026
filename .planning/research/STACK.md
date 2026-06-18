# Tech Stack: AB0-1 Mobile

**Projeto:** AB0-1-mobile
**Pesquisado em:** 17/06/2026

## Stack Recomendada (Estado Atual)

### Core Framework
| Tecnologia | Versão | Propósito | Por que? |
|------------|---------|---------|-----|
| Expo | ~56.0.11 | Framework Platform | Facilita o desenvolvimento cross-platform e OTA updates. |
| React Native | 0.85.3 | Mobile Runtime | Base do desenvolvimento nativo. |
| React | 19.2.3 | UI Library | Última versão com suporte a Server Components e hooks avançados. |
| Expo Router | ~56.2.10 | Navigation | Navegação baseada em arquivos, similar ao Next.js. |

### Networking & Data
| Tecnologia | Versão | Propósito | Por que? |
|------------|---------|---------|-----|
| Apollo Client | ^4.2.3 | GraphQL Client | Gerencia dados complexos, normalização de cache e persistência. |
| TanStack Query | ^5.101.0 | REST/Async State | Gerencia requisições REST e estados de carregamento/erro. |
| ActionCable | ^8.1.300 | WebSockets | Comunicação em tempo real para Chat e atualizações de Dashboard. |

### Estado Global & Persistência
| Tecnologia | Versão | Propósito | Por que? |
|------------|---------|---------|-----|
| Zustand | ^5.0.14 | Global State | Leve, intuitivo e sem boilerplate excessivo. |
| Secure Store | ^56.0.4 | Token Storage | Armazenamento seguro de tokens JWT. |
| AsyncStorage | ^2.2.0 | Cache Storage | Persistência de cache do Apollo e dados não sensíveis. |

### UI & Utilitários
| Tecnologia | Versão | Propósito | Por que? |
|------------|---------|---------|-----|
| Lucide RN | ^1.18.0 | Icons | Conjunto de ícones moderno e consistente. |
| PostHog RN | ^4.47.2 | Analytics | Tracking de eventos e comportamento do usuário. |
| NativeWind (implied) | - | Styling | Utiliza utilitários Tailwind para estilização rápida. |

## Alternativas Consideradas no Projeto

| Categoria | Recomendado | Alternativa | Por que não? |
|----------|-------------|-------------|---------|
| Networking | Apollo + Query | Axios | O projeto já usa Query para REST; Apollo é necessário para o ecossistema GraphQL do backend. |
| Estado | Zustand | Redux Toolkit | Zustand atende a complexidade do app sem a verbosidade do Redux. |

## Instalação (Dependências Principais)

```bash
# Core
npx expo install expo-router react-native-safe-area-context react-native-screens

# Data & Networking
npm install @apollo/client @tanstack/react-query @rails/actioncable

# State
npm install zustand
```

## Fontes
- `package.json`
- `src/lib/api.ts`
- `src/lib/apolloClient.ts`
