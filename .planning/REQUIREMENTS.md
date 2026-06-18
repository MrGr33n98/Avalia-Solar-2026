# Requirements - Avalia Solar Mobile App

Este documento detalha os requisitos funcionais e não funcionais para o aplicativo mobile Avalia Solar, mapeados a partir dos objetivos de negócio e dívidas técnicas identificadas.

## Requisitos de Negócio (v1)

### Home & Integração (HOME)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| HOME-01 | Integrar a Home real via GraphQL consumindo Categorias, Banners e Empresas em Destaque. | P0 |
| MOCK-01 | Auditoria e remoção completa de mocks e dados hardcoded em telas de produção (index.tsx, etc). | P0 |

### Autenticação (AUTH)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| AUTH-01 | Implementar autenticação real com persistência de tokens JWT via Expo SecureStore. | P0 |

### Conversão & Marketplace (LEAD/QR)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| LEAD-01 | Implementar formulário de orçamento real conectado à API de leads do backend Rails. | P1 |
| QR-01 | Implementar fluxo de Review via QR Code com suporte a Deep Linking e integração com API de reputação. | P1 |

### Comunicação (CHAT)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| CHAT-01 | Unificar o Chat P2P real utilizando ActionCable e a `conversationsApi`, removendo a versão mockada. | P2 |

## Requisitos para Versão 100% Android

### Base Técnica (AND)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| AND-01 | Reconstruir o aplicativo usando Kotlin/Java e o SDK nativo do Android, substituindo a base React Native/Expo. | P0 |
| AND-02 | Implementar UI/UX seguindo as diretrizes do Material Design do Android para uma experiência nativa coesa. | P0 |
| AND-03 | Estabelecer uma arquitetura de projeto nativa Android escalável e sustentável (e.g., MVVM, Clean Architecture). | P0 |
| AND-04 | Adaptar a integração GraphQL (Apollo Client) para o ambiente nativo Android (e.g., Apollo Android, Retrofit + GraphQL). | P0 |
| AND-05 | Adaptar a integração ActionCable para o ambiente nativo Android para funcionalidade de chat em tempo real. | P1 |
| AND-06 | Garantir que as funcionalidades de persistência de dados sensíveis (tokens) utilizem Secure Storage nativo do Android. | P0 |
| AND-07 | Otimizar o desempenho do aplicativo para tirar proveito dos recursos nativos do Android, excedendo os NFRs existentes, se possível. | P1 |


## Requisitos Não Funcionais

| ID | Descrição |
|----|-----------|
| NFR-01 | Performance: Tempo de carregamento da Home < 2s em conexões 4G estáveis. |
| NFR-02 | Segurança: Dados sensíveis (tokens) nunca devem ser armazenados em AsyncStorage sem criptografia. |
| NFR-03 | Localização: Todo o conteúdo e interface devem estar em PT-BR. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOME-01 | Phase 3 | Pending |
| MOCK-01 | Phase 3 | Pending |
| AUTH-01 | Phase 2 | Pending |
| LEAD-01 | Phase 4 | Pending |
| QR-01 | Phase 4 | Pending |
| CHAT-01 | Phase 5 | Pending |
| NFR-01 | Phase 6 | Pending |
| NFR-02 | Phase 6 | Pending |
| NFR-03 | Phase 4 | Pending |
| AND-01 | Phase 1 | Pending |
| AND-02 | Phase 6 | Pending |
| AND-03 | Phase 1 | Pending |
| AND-04 | Phase 1 | Pending |
| AND-05 | Phase 5 | Pending |
| AND-06 | Phase 2 | Pending |
| AND-07 | Phase 6 | Pending |
