# DISCOVERY — App Android Avalia Solar

## Contexto e Objetivo
Levantamento técnico para a criação de um aplicativo Android (via React Native/Expo) consumindo o mesmo ecossistema, banco de dados e backend Rails atualmente utilizado pela plataforma web (Next.js).

---

## 1. Mapeamento da Arquitetura Atual

- **Frontend atual**: Next.js (React) usando Tailwind CSS e TypeScript. A comunicação com o servidor é encapsulada em clientes HTTP (`lib/api-client.ts`, `lib/api.ts`).
- **Backend atual**: Ruby on Rails no formato API (encontrado em `app/controllers/api/v1`).
- **Banco de Dados**: PostgreSQL, atuando como a única fonte da verdade (SSOT).
- **Admin**: Active Admin configurado em `app/admin`, centralizando a governança dos dados (empresas, planos, leads, avaliações, SEO).
- **Autenticação**: Baseada em Devise, exportada via endpoints API (`AuthController`). O fluxo lida com JWT (Access e Refresh tokens). Atualmente os tokens são injetados em cookies HTTP-Only e também retornados no payload JSON das respostas de login/cadastro.
- **APIs existentes**: Extensa cobertura REST no namespace `/api/v1`. Quase tudo que o App Android precisa já existe:
  - Busca e listagem (`/companies`, `/categories`, `states/cities`).
  - Captação de Leads/Wizards (`/leads`, `/lead_wizards/resolve`).
  - Engajamento (`/reviews`, `/articles`).
  - Dashboards (`/dashboard/stats`, `/company_dashboard/*`).
- **Principais limitações**:
  1. **Configuração CORS**: O Rails restringe as origens HTTP (`cors.rb`). O React Native nativo bypassa CORS, mas em ambiente de desenvolvimento web (Expo Web) ou WebViews, pode ser necessário adicionar domínios.
  2. **ActiveStorage em Mobile**: Upload de imagens (avatares, logos, mídias de review) no React Native exige cuidado especial na formatação do pacote `multipart/form-data`, pois o motor JS difere do browser web.
  3. **Links de Deep Linking**: E-mails de confirmação e recuperação de senha apontam para URLs web. Será preciso configurar **Universal Links/App Links** para abrir o app Android, ou manter o fluxo de recuperação no ambiente Web.

---

## 2. Como Consumir os Mesmos Dados do Site
A fundação já é perfeitamente adequada para ser consumida por múltiplos clientes.

1. **Cliente HTTP Mobile**: Utilizar `axios` no React Native apontando para a base URL de produção do Rails.
2. **Autenticação**: Ao fazer `POST /api/v1/auth/login`, o app deve capturar a chave `token` do JSON de resposta (já que cookies são mais difíceis de gerenciar no React Native) e salvar em `SecureStore`.
3. **Interceptor**: Configurar um interceptor no Axios para adicionar `Authorization: Bearer <token>` em todas as chamadas futuras. (O backend Rails já possui um fallback em `extract_token_from_header` no `AuthController` que busca o token nos headers).
4. **Estado de Interface**: Aproveitar a familiaridade com React e usar bibliotecas como `React Query` (ou `SWR`) no React Native para lidar com o ciclo de vida dos dados, mantendo a experiência de loading/error análoga ao Next.js.

---

## 3. Gestão Centralizada no Active Admin
**Nenhuma alteração é necessária.**
Como o app consumirá os mesmos endpoints REST da aplicação Next.js (ex: `/api/v1/leads`), a entrada de dados acontecerá via banco de dados usando os mesmos *Models*. O Active Admin visualizará leads vindos do App e da Web na mesma tela, sem distinção (a menos que criemos um campo `origin: 'mobile'` futuramente para rastreamento analítico, o que já é suportado via PostHog no `auth_controller`).

---

## 4. Caminho Técnico Recomendado (MVP Android)

Recomendamos fortemente o uso de **Expo (React Native)**. Como a equipe já domina React (Next.js) e TypeScript, a curva de aprendizado será mínima e permitirá compartilhar lógicas (hooks e utilitários de API).

### Fases de Implementação Sugeridas:
- **Fase 1: Setup e Autenticação (Semanas 1-2)**
  - Criação do repositório Expo (`AB0-1-app`).
  - Setup do NativeWind (Tailwind para React Native) reaproveitando o Style Guide do projeto atual.
  - Telas de Login e Cadastro com armazenamento seguro de JWT.
- **Fase 2: Core Público (Semanas 2-3)**
  - Home Page (Destaques, Banners Globais).
  - Listagem e busca de empresas (`/api/v1/companies`).
  - Categorias e filtros geográficos.
- **Fase 3: Engajamento e Captação (Semanas 3-4)**
  - Página de Detalhes da Empresa.
  - Fluxo de solicitação de orçamento (Leads Wizard).
  - Envio de reviews e avaliações.
- **Fase 4: Perfil do Usuário e Finalizações**
  - Gerenciamento de conta, WebViews de termos legais.
  - (Opcional) Webview da dashboard B2B para usuários "Company" se não quiserem implementar dezenas de gráficos no mobile V1.

---

## 5. Riscos e Precauções

| Risco | Nível | Mitigação |
|---|---|---|
| Duplicação de Lógica Comercial | Alto | Manter o frontend Android estritamente como "View/Presenter". Qualquer validação complexa ou cálculo de ranking DEVE permanecer nos models/services do Rails. |
| Incompatibilidade de Login (Cookies vs Token Header) | Médio | O `auth_controller.rb` já exporta o token via JSON. Confirmar que APIs protegidas não confiam estritamente apenas nos Cookies e sempre lêem o `Authorization` header. |
| Tratamento de Imagens e Documentos | Médio | Testar o módulo de upload de avatares com antecedência usando `FormData` com `uri`, `name` e `type` adequados ao RN. |
