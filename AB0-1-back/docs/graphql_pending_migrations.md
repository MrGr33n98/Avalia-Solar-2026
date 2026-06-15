# GraphQL Pending Migrations — Avalia Solar

Este documento detalha todas as rotas REST da API `/api/v1` que ainda não possuem equivalência em GraphQL, descrevendo sua finalidade, parâmetros e a modelagem correspondente sugerida para o schema do GraphQL.

---

## 1. Filtros Geográficos e Busca (MIGRADOS — FASE 10)

Os campos abaixo foram implementados e estão operando com sucesso:
- `activeStates` (`GET /api/v1/states`)
- `activeCities` (`GET /api/v1/companies/cities`)
- `activeLocations` (Pares cidade/estado)
- `categoryTree` (`GET /api/v1/categories/tree` - Recursivo)
- `banners` (`GET /api/v1/banners` - Banners Ativos)

---

## 3. Contexto e Dados Pessoais do Usuário (Autenticado)

As queries abaixo exigem que o cabeçalho `Authorization: Bearer <token>` seja passado e resolvido no `context[:current_user]` do GraphQL.

### 👤 Perfil do Usuário
*   **Endpoint REST:** `GET /api/v1/auth/me` ou `GET /api/v1/users/:id`
*   **Finalidade:** Carregar informações da conta logada.
*   **GraphQL Sugerido:**
    ```graphql
    type User {
      id: ID!
      name: String!
      email: String!
      role: String!
      createdAt: GraphQL::Types::ISO8601DateTime!
    }

    extend type Query {
      me: User
    }
    ```
*   **Resolver Rails:** Retorna `context[:current_user]`.

### 📋 Meus Orçamentos (Leads)
*   **Endpoint REST:** `GET /api/v1/leads/mine`
*   **Finalidade:** Exibir o histórico de orçamentos enviados pelo cliente na área "Meus Orçamentos".
*   **GraphQL Sugerido:**
    ```graphql
    extend type Query {
      myLeads(page: Int, limit: Int): [Lead!]!
    }
    ```
*   **Resolver Rails:** Retorna `context[:current_user].leads.order(created_at: :desc)`.

### ⭐ Minhas Avaliações (Reviews)
*   **Endpoint REST:** `GET /api/v1/reviews/mine`
*   **Finalidade:** Exibir e gerenciar as avaliações que o usuário logado fez para as empresas.
*   **GraphQL Sugerido:**
    ```graphql
    extend type Query {
      myReviews(page: Int, limit: Int): [Review!]!
    }
    ```
*   **Resolver Rails:** Retorna `context[:current_user].reviews.order(created_at: :desc)`.

---

## 4. Blog, Notícias e Artigos

### 📰 Feed de Artigos
*   **Endpoint REST:** `GET /api/v1/articles` e `GET /api/v1/articles/featured`
*   **Finalidade:** Listar artigos do blog do Avalia Solar.
*   **GraphQL Sugerido:**
    ```graphql
    type Article {
      id: ID!
      title: String!
      slug: String!
      summary: String
      content: String
      imageUrl: String
      publishedAt: GraphQL::Types::ISO8601DateTime
      featured: Boolean!
    }

    extend type Query {
      articles(featured: Boolean, limit: Int): [Article!]!
      article(slug: String!): Article
    }
    ```

---

## 5. Financiamento e Simulações (Avançado)

### 🏦 Simulação de Financiamento
*   **Endpoint REST:** `GET /api/v1/companies/:company_id/financing_options/compare`
*   **Finalidade:** Simular parcelas e comparar taxas de financiamento solar oferecidas por parceiros da empresa.
*   **GraphQL Sugerido:**
    ```graphql
    type FinancingOption {
      partnerName: String!
      monthlyInstallment: Float!
      interestRate: Float!
      totalCost: Float!
      termMonths: Int!
    }

    extend type Query {
      compareFinancingOptions(
        companyId: ID!
        projectCost: Float!
        downPayment: Float
      ): [FinancingOption!]!
    }
    ```

---

## 6. Sessão e Autenticação (Opcional via GraphQL)

*Nota: Recomenda-se manter o fluxo de login e renovação de tokens (refresh token) via HTTP REST devido ao suporte nativo dos navegadores a cookies HTTPOnly e facilidade de cabeçalhos de segurança, mas podem ser expostos como mutations:*

*   **GraphQL Sugerido:**
    ```graphql
    type AuthPayload {
      token: String!
      user: User!
    }

    extend type Mutation {
      login(email: String!, password: String!): AuthPayload!
      signup(name: String!, email: String!, password: String!): AuthPayload!
    }
    ```
