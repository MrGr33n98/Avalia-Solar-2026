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

## Requisitos Não Funcionais

| ID | Descrição |
|----|-----------|
| NFR-01 | Performance: Tempo de carregamento da Home < 2s em conexões 4G estáveis. |
| NFR-02 | Segurança: Dados sensíveis (tokens) nunca devem ser armazenados em AsyncStorage sem criptografia. |
| NFR-03 | Localização: Todo o conteúdo e interface devem estar em PT-BR. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOME-01 | Phase 1 | Pending |
| MOCK-01 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| LEAD-01 | Phase 3 | Pending |
| QR-01 | Phase 3 | Pending |
| CHAT-01 | Phase 4 | Pending |
