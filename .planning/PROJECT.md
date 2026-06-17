# Projeto: Avalia Solar Mobile App

O Avalia Solar Mobile App é o aplicativo oficial do ecossistema Avalia Solar, desenvolvido em Expo/React Native. Ele serve como um marketplace de energia solar e mobilidade elétrica, conectando consumidores a empresas instaladoras e produtos.

## Visão e Objetivos

Transformar o app mobile em um marketplace confiável e de alto desempenho, removendo dependências de dados simulados (mocks) e integrando-se diretamente ao ecossistema real do Avalia Solar.

### Objetivos Principais
- **Fideldade de Dados:** Substituir todos os mocks de empresas, produtos e banners por dados reais via GraphQL.
- **Experiência Premium:** Interface polida, mobile-first e em PT-BR.
- **Engajamento:** Fluxos reais de Chat P2P, Review via QR Code e Calculadora Solar com OCR.
- **Conversão:** Geração de leads qualificados diretamente para o backend Rails.

## Stack Técnica

- **Frontend:** React Native (Expo SDK), Expo Router (File-based routing).
- **Linguagem:** TypeScript.
- **Data Fetching:** Apollo Client (GraphQL) - *Decisão de escala*.
- **Backend:** Ruby on Rails (API Principal).
- **Real-time:** ActionCable (para Chat P2P).
- **Analytics:** PostHog.
- **Storage:** Active Storage (via API).

## Requisitos Principais (Resumo do PRD)

### Validated
(Aguardando primeira fase de integração real)

### Active
- [ ] **HOME-01**: Integrar Home real via GraphQL (Categorias, Banners, Empresas em Destaque).
- [ ] **AUTH-01**: Implementar Autenticação real com persistência em SecureStore.
- [ ] **QR-01**: Fluxo de Review via QR Code (Deep Linking + Integração API).
- [ ] **CHAT-01**: Unificar Chat P2P real usando ActionCable e `conversationsApi`.
- [ ] **LEAD-01**: Formulário de orçamento real conectado à API de leads.
- [ ] **MOCK-01**: Auditoria e remoção completa de mocks em telas de produção.

### Out of Scope
- **Admin Mobile:** O gerenciamento administrativo continua exclusivo no Web/Active Admin (P3).
- **Pagamentos In-App:** O fechamento comercial ocorre via lead/chat (fora do gateway de pagamento nativo por enquanto).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Apollo GraphQL | Preferido em vez de REST para melhor escala e eficiência de dados. | Active |
| Expo Managed Workflow | Facilita a manutenção, builds (EAS) e atualizações OTA. | Active |
| Mobile-First Design | Interface deve ser projetada para toque (alvos de 44px+) e performance mobile. | Active |

---
*Last updated: 16 de junho de 2026 após inicialização*
