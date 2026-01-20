# 🔌 API Endpoints Reference - Avalia Solar

**Base URL (Dev):** `http://localhost:3001/api/v1`  
**Base URL (Prod):** `https://api.avaliasolar.com.br/api/v1`

**Authentication:** JWT Bearer Token (onde necessário)

---

## 🏢 Companies

### GET /api/v1/companies
Lista todas as empresas com paginação e filtros.

**Query Parameters:**
- `page` (integer, default: 1)
- `per_page` (integer, default: 20, max: 100)
- `city` (string, optional) - Filtrar por cidade
- `state` (string, optional) - Filtrar por estado (ex: "SC", "PR")
- `verified` (boolean, optional) - Apenas empresas verificadas
- `search` (string, optional) - Busca por nome

**Example Request:**
```bash
curl "http://localhost:3001/api/v1/companies?state=SC&verified=true&page=1"
```

**Example Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "WEG Solar",
      "slug": "weg-solar",
      "city": "Jaraguá do Sul",
      "state": "SC",
      "description": "Líder em soluções de energia solar...",
      "logo_url": "https://api.avaliasolar.com.br/uploads/weg-logo.png",
      "average_rating": 4.7,
      "reviews_count": 42,
      "verified": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 89,
    "per_page": 20
  }
}
```

### GET /api/v1/companies/:slug
Retorna detalhes de uma empresa específica.

**Path Parameters:**
- `slug` (string, required) - Slug da empresa (ex: "weg-solar")

**Example Request:**
```bash
curl "http://localhost:3001/api/v1/companies/weg-solar"
```

**Example Response (200 OK):**
```json
{
  "id": 1,
  "name": "WEG Solar",
  "slug": "weg-solar",
  "cnpj": "12.345.678/0001-99",
  "email": "contato@wegsolar.com.br",
  "phone": "(47) 3276-4000",
  "website": "https://wegsolar.com.br",
  "city": "Jaraguá do Sul",
  "state": "SC",
  "address": "Av. Prefeito Waldemar Grubba, 3300",
  "latitude": -26.4766,
  "longitude": -49.0775,
  "description": "A WEG Solar oferece soluções completas...",
  "logo_url": "https://api.avaliasolar.com.br/uploads/weg-logo.png",
  "average_rating": 4.7,
  "reviews_count": 42,
  "products_count": 15,
  "verified": true,
  "year_founded": 1961,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-15T10:30:00Z",
  "schema_json_ld": {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "WEG Solar",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Jaraguá do Sul",
      "addressRegion": "SC"
    },
    "telephone": "(47) 3276-4000",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.7,
      "reviewCount": 42
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Company not found",
  "status": 404
}
```

### POST /api/v1/companies
Cria uma nova empresa (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "company": {
    "name": "Nova Solar",
    "email": "contato@novasolar.com.br",
    "phone": "(48) 99999-9999",
    "city": "Florianópolis",
    "state": "SC",
    "description": "Empresa especializada em...",
    "cnpj": "98.765.432/0001-11"
  }
}
```

**Response (201 Created):**
```json
{
  "id": 100,
  "name": "Nova Solar",
  "slug": "nova-solar",
  "message": "Company created successfully"
}
```

---

## 🔋 Products

### GET /api/v1/products
Lista produtos com filtros.

**Query Parameters:**
- `page` (integer, default: 1)
- `per_page` (integer, default: 20)
- `category` (string, optional) - Slug da categoria
- `featured` (boolean, optional) - Apenas produtos em destaque
- `company_slug` (string, optional) - Produtos de uma empresa
- `min_price` (decimal, optional)
- `max_price` (decimal, optional)

**Example Request:**
```bash
curl "http://localhost:3001/api/v1/products?category=paineis-solares&featured=true"
```

**Example Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Painel Solar Canadian 450W",
      "slug": "painel-canadian-450w",
      "company": {
        "id": 1,
        "name": "WEG Solar",
        "slug": "weg-solar"
      },
      "category": {
        "id": 1,
        "name": "Painéis Solares",
        "slug": "paineis-solares"
      },
      "description": "Painel solar monocristalino...",
      "price": 750.00,
      "power_rating": 450.0,
      "manufacturer": "Canadian Solar",
      "model_number": "CS3W-450P",
      "warranty_years": 25,
      "featured": true,
      "image_url": "https://api.avaliasolar.com.br/uploads/canadian-450.jpg"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 58,
    "per_page": 20
  }
}
```

### GET /api/v1/products/:slug
Detalhes de um produto.

**Example Response (200 OK):**
```json
{
  "id": 1,
  "name": "Painel Solar Canadian 450W",
  "slug": "painel-canadian-450w",
  "company": {
    "id": 1,
    "name": "WEG Solar",
    "slug": "weg-solar"
  },
  "category": {
    "id": 1,
    "name": "Painéis Solares",
    "slug": "paineis-solares"
  },
  "description": "Painel solar monocristalino de alta eficiência...",
  "price": 750.00,
  "power_rating": 450.0,
  "manufacturer": "Canadian Solar",
  "model_number": "CS3W-450P",
  "warranty_years": 25,
  "featured": true,
  "image_url": "https://api.avaliasolar.com.br/uploads/canadian-450.jpg",
  "specs": [
    {
      "name": "efficiency",
      "value": "20.8%",
      "label": "Eficiência"
    },
    {
      "name": "dimensions",
      "value": "2094 x 1038 x 40mm",
      "label": "Dimensões"
    },
    {
      "name": "weight",
      "value": "23.5kg",
      "label": "Peso"
    }
  ],
  "schema_json_ld": {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Painel Solar Canadian 450W",
    "brand": "WEG Solar",
    "offers": {
      "@type": "Offer",
      "price": 750.00,
      "priceCurrency": "BRL"
    }
  }
}
```

### GET /api/v1/products/compare
Compara múltiplos produtos.

**Query Parameters:**
- `ids[]` (array of integers, required, min: 2, max: 3)

**Example Request:**
```bash
curl "http://localhost:3001/api/v1/products/compare?ids[]=1&ids[]=2&ids[]=3"
```

**Example Response (200 OK):**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Painel Canadian 450W",
      "price": 750.00,
      "power_rating": 450.0,
      "warranty_years": 25,
      "efficiency": "20.8%"
    },
    {
      "id": 2,
      "name": "Painel Jinko 440W",
      "price": 720.00,
      "power_rating": 440.0,
      "warranty_years": 25,
      "efficiency": "20.5%"
    }
  ],
  "comparison": {
    "best_price": { "product_id": 2, "value": 720.00 },
    "best_power": { "product_id": 1, "value": 450.0 },
    "best_warranty": { "product_id": 1, "value": 25 }
  }
}
```

---

## ⭐ Reviews

### GET /api/v1/companies/:company_slug/reviews
Lista reviews de uma empresa.

**Query Parameters:**
- `page` (integer, default: 1)
- `per_page` (integer, default: 10)
- `rating` (integer, optional, 1-5) - Filtrar por nota

**Example Request:**
```bash
curl "http://localhost:3001/api/v1/companies/weg-solar/reviews?rating=5"
```

**Example Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "user": {
        "id": 5,
        "name": "João Silva"
      },
      "company": {
        "id": 1,
        "name": "WEG Solar",
        "slug": "weg-solar"
      },
      "rating": 5,
      "title": "Excelente empresa!",
      "content": "Instalaram meu sistema em 3 dias. Equipe muito profissional...",
      "verified_purchase": true,
      "approved": true,
      "created_at": "2026-01-10T14:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 42,
    "per_page": 10,
    "average_rating": 4.7
  }
}
```

### POST /api/v1/companies/:company_slug/reviews
Criar uma nova review (usuário autenticado ou anônimo).

**Headers (opcional para usuários logados):**
```
Authorization: Bearer <jwt_token>
```

**Request Body (Usuário logado):**
```json
{
  "review": {
    "rating": 5,
    "title": "Excelente atendimento",
    "content": "A empresa superou minhas expectativas. Instalação rápida e bem feita."
  }
}
```

**Request Body (Anônimo):**
```json
{
  "review": {
    "rating": 4,
    "title": "Bom serviço",
    "content": "Instalação ok, mas demorou um pouco mais que o previsto.",
    "reviewer_name": "Maria Santos",
    "reviewer_email": "maria@example.com"
  }
}
```

**Response (201 Created):**
```json
{
  "id": 100,
  "message": "Review submitted successfully. It will be reviewed by our team.",
  "approved": false
}
```

**Validation Errors (422 Unprocessable Entity):**
```json
{
  "errors": [
    "Rating can't be blank",
    "Content is too short (minimum is 50 characters)"
  ]
}
```

---

## 📝 Blog Posts

### GET /api/v1/posts
Lista posts do blog.

**Query Parameters:**
- `page` (integer, default: 1)
- `per_page` (integer, default: 10)
- `category` (string, optional) - Slug da categoria
- `published` (boolean, default: true)

**Example Request:**
```bash
curl "http://localhost:3001/api/v1/posts?category=guias"
```

**Example Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Melhor Inversor Solar 2026",
      "slug": "melhor-inversor-solar-2026",
      "excerpt": "Descubra quais são os melhores inversores...",
      "featured_image_url": "https://api.avaliasolar.com.br/uploads/inversor-hero.jpg",
      "category": {
        "id": 2,
        "name": "Guias",
        "slug": "guias"
      },
      "author": {
        "id": 1,
        "name": "Equipe Avalia Solar"
      },
      "published_at": "2026-01-15T10:00:00Z",
      "views_count": 1523
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 28,
    "per_page": 10
  }
}
```

### GET /api/v1/posts/:slug
Detalhes de um post.

**Example Response (200 OK):**
```json
{
  "id": 1,
  "title": "Melhor Inversor Solar 2026",
  "slug": "melhor-inversor-solar-2026",
  "content": "<h2>Introdução</h2><p>Os inversores solares...</p>",
  "excerpt": "Descubra quais são os melhores inversores...",
  "meta_title": "Os 10 Melhores Inversores Solares de 2026 | Avalia Solar",
  "meta_description": "Compare os melhores inversores solares do mercado. Análise técnica, preços e reviews.",
  "featured_image_url": "https://api.avaliasolar.com.br/uploads/inversor-hero.jpg",
  "category": {
    "id": 2,
    "name": "Guias",
    "slug": "guias"
  },
  "author": {
    "id": 1,
    "name": "Equipe Avalia Solar",
    "bio": "Especialistas em energia solar"
  },
  "published_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z",
  "views_count": 1523,
  "related_posts": [
    {
      "id": 2,
      "title": "Como Escolher Inversor",
      "slug": "como-escolher-inversor",
      "excerpt": "Guia completo..."
    }
  ],
  "schema_json_ld": {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Melhor Inversor Solar 2026",
    "author": {
      "@type": "Person",
      "name": "Equipe Avalia Solar"
    },
    "datePublished": "2026-01-15T10:00:00Z"
  }
}
```

---

## 📍 Local Pages

### GET /api/v1/local/:state/:city
Retorna dados de uma página local.

**Path Parameters:**
- `state` (string, required) - Sigla do estado (ex: "sc", "pr")
- `city` (string, required) - Slug da cidade (ex: "florianopolis")

**Example Request:**
```bash
curl "http://localhost:3001/api/v1/local/sc/florianopolis"
```

**Example Response (200 OK):**
```json
{
  "id": 1,
  "city": "Florianópolis",
  "state": "SC",
  "slug": "florianopolis-sc",
  "content": "<h2>Energia Solar em Florianópolis</h2><p>A capital...</p>",
  "meta_title": "Energia Solar Florianópolis SC | Empresas e Preços 2026",
  "meta_description": "Encontre as melhores empresas de energia solar em Florianópolis. Compare preços, avaliações e solicite orçamentos grátis.",
  "latitude": -27.5954,
  "longitude": -48.5480,
  "population": 500000,
  "nearby_companies": [
    {
      "id": 5,
      "name": "Solar Floripa",
      "slug": "solar-floripa",
      "average_rating": 4.8,
      "reviews_count": 15
    }
  ],
  "stats": {
    "companies_count": 12,
    "average_system_cost": 18000,
    "average_payback_years": 4.5
  }
}
```

---

## 📨 Leads (Cotações)

### POST /api/v1/leads
Criar uma solicitação de orçamento.

**Request Body:**
```json
{
  "lead": {
    "name": "Carlos Oliveira",
    "email": "carlos@example.com",
    "phone": "(48) 99999-9999",
    "city": "Florianópolis",
    "state": "SC",
    "consumption_kwh": 350,
    "average_bill": 450.00,
    "message": "Quero orçamento para sistema residencial de 3kWp"
  }
}
```

**Response (201 Created):**
```json
{
  "id": 100,
  "message": "Lead received successfully! Companies will contact you soon.",
  "estimated_contacts": 5
}
```

**Validation Errors (422):**
```json
{
  "errors": [
    "Email can't be blank",
    "Phone can't be blank",
    "Name is too short (minimum is 3 characters)"
  ]
}
```

---

## 🔐 Authentication

### POST /api/v1/auth/signup
Criar nova conta de usuário.

**Request Body:**
```json
{
  "user": {
    "email": "novo@example.com",
    "password": "senha123",
    "password_confirmation": "senha123",
    "name": "Novo Usuário",
    "phone": "(48) 99999-9999"
  }
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 100,
    "email": "novo@example.com",
    "name": "Novo Usuário",
    "role": "user"
  }
}
```

### POST /api/v1/auth/login
Login de usuário.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "email": "usuario@example.com",
    "name": "João Silva",
    "role": "user"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

### GET /api/v1/auth/me
Retorna dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "id": 5,
  "email": "usuario@example.com",
  "name": "João Silva",
  "phone": "(48) 99999-9999",
  "role": "user",
  "created_at": "2025-12-01T00:00:00Z"
}
```

---

## 📦 Categories

### GET /api/v1/categories
Lista categorias.

**Example Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Painéis Solares",
      "slug": "paineis-solares",
      "description": "Módulos fotovoltaicos",
      "icon_url": "https://api.avaliasolar.com.br/icons/panel.svg",
      "products_count": 45,
      "active": true
    },
    {
      "id": 2,
      "name": "Inversores",
      "slug": "inversores",
      "description": "Inversores grid-tie e off-grid",
      "icon_url": "https://api.avaliasolar.com.br/icons/inverter.svg",
      "products_count": 32,
      "active": true
    }
  ]
}
```

---

## 🚨 Error Responses

Todos os endpoints podem retornar os seguintes erros:

### 400 Bad Request
```json
{
  "error": "Invalid parameters",
  "details": "Page must be a positive integer"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "You need to sign in or sign up before continuing"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "resource": "Company",
  "id": "invalid-slug"
}
```

### 422 Unprocessable Entity
```json
{
  "errors": [
    "Email has already been taken",
    "Password is too short (minimum is 6 characters)"
  ]
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Something went wrong. Please try again later."
}
```

---

## 📊 Rate Limiting

- **Anonymous requests:** 60 requests/hour
- **Authenticated requests:** 300 requests/hour
- **Headers inclusos na resposta:**
  - `X-RateLimit-Limit`: Total de requests permitidos
  - `X-RateLimit-Remaining`: Requests restantes
  - `X-RateLimit-Reset`: Timestamp do reset

**Example:**
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 275
X-RateLimit-Reset: 1705680000
```

---

## 🧪 Testing Endpoints

### Usando cURL

```bash
# GET request
curl -X GET "http://localhost:3001/api/v1/companies" \
  -H "Accept: application/json"

# POST request com autenticação
curl -X POST "http://localhost:3001/api/v1/reviews" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"review": {"rating": 5, "title": "Great!", "content": "Excellent service"}}'
```

### Usando JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Adicionar token para requests autenticados
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Exemplo de uso
const companies = await api.get('/companies', {
  params: { state: 'SC', page: 1 }
});
```

---

**Última Atualização:** 2026-01-19  
**Versão da API:** v1
