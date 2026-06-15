# GraphQL Schema — Avalia Solar

## Endpoint
```
POST /graphql
Authorization: Bearer <JWT_TOKEN>  (obrigatório apenas em mutations e queries autenticadas)
Content-Type: application/json
```

---

## Types

### CompanyType (campos públicos)
```graphql
type Company {
  id: ID!
  name: String!
  slug: String!
  description: String
  shortDescription: String
  logoUrl: String
  coverUrl: String
  city: String
  state: String
  ratingAvg: Float
  reviewsCount: Int
  isVerified: Boolean
  isFeatured: Boolean
  isSponsored: Boolean
  website: String
  segment: String
  projectTypes: [String!]
  servicesOffered: [String!]
  coverageStates: [String!]
  coverageCities: [String!]
  categories: [Category!]
  badges: [Badge!]
  reviews(limit: Int): [Review!]
  canViewContact: Boolean   # Respeita regras de plano/autenticação
  createdAt: ISO8601DateTime
}
```

### CategoryType
```graphql
type Category {
  id: ID!
  name: String!
  slug: String
  shortDescription: String
  description: String
  iconUrl: String
  bannerUrl: String
  companiesCount: Int
  featured: Boolean
  children: [Category!]
  position: Int
}
```

### ReviewType
```graphql
type Review {
  id: ID!
  rating: Float!
  comment: String
  headline: String
  pros: [String!]
  cons: [String!]
  buyerTip: String
  authorName: String    # Apenas nome público, sem email
  companyReply: String
  repliedAt: ISO8601DateTime
  status: String
  projectType: String
  installationStatus: String
  featured: Boolean
  verified: Boolean
  createdAt: ISO8601DateTime
}
```

### LeadType (dados mínimos públicos)
```graphql
type Lead {
  id: ID!
  status: String
  companyId: ID
  createdAt: ISO8601DateTime
}
```

---

## Queries

### company — Detalhes de uma empresa
```graphql
query Company($slug: String!) {
  company(slug: $slug) {
    id name slug description logoUrl coverUrl
    city state ratingAvg reviewsCount
    isVerified isFeatured isSponsored
    categories { id name slug }
    reviews(limit: 5) { id rating comment authorName createdAt }
  }
}
```

### companies — Listagem com filtros
```graphql
query Companies(
  $q: String
  $city: String
  $state: String
  $categoryId: ID
  $verified: Boolean
  $featured: Boolean
  $minRating: Float
  $sort: String
  $page: Int
  $limit: Int
) {
  companies(
    q: $q, city: $city, state: $state
    categoryId: $categoryId, verified: $verified
    featured: $featured, minRating: $minRating
    sort: $sort, page: $page, limit: $limit
  ) {
    nodes {
      id name slug logoUrl city state
      ratingAvg reviewsCount isVerified isFeatured isSponsored
      categories { id name slug }
    }
    pageInfo {
      currentPage totalPages totalCount
    }
  }
}
```

### categories — Lista de categorias
```graphql
query Categories($featured: Boolean, $limit: Int) {
  categories(featured: $featured, limit: $limit) {
    id name slug shortDescription iconUrl
    companiesCount featured children { id name slug }
  }
}
```

---

## Mutations

### createLead
```graphql
mutation CreateLead($input: CreateLeadInput!) {
  createLead(input: $input) {
    lead { id status }
    errors
  }
}

input CreateLeadInput {
  companyId: ID!
  name: String!
  email: String!
  phone: String!
  message: String
  city: String
  state: String
  serviceType: String
  origin: String
  lgpdConsent: Boolean!
}
```

### createReview
```graphql
mutation CreateReview($input: CreateReviewInput!) {
  createReview(input: $input) {
    review { id rating status }
    errors
  }
}

input CreateReviewInput {
  companyId: ID!
  categoryId: ID!
  rating: Float!
  comment: String
  headline: String
  projectType: String
}
```

---

## Segurança

| Regra | Implementação |
|---|---|
| Depth limit | `max_depth: 7` no schema |
| Complexity limit | `max_complexity: 200` no schema |
| Rate limit | rack-attack no endpoint `/graphql` |
| Introspection | Desabilitado em produção |
| Autenticação | `context[:current_user]` via JWT |
| Campos sensíveis | Resolver retorna `nil` sem autenticação |
| N+1 queries | graphql-batch DataLoader |
