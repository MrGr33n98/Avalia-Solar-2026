# 🌞 Avalia Solar - Arquitetura Full-Stack Completa

## 📋 Sumário Executivo

**Projeto:** Avalia Solar (www.avaliasolar.com.br)  
**Objetivo:** Marketplace brasileiro para comparação de empresas, produtos, financiamentos e orçamentos de energia solar  
**Stack Principal:** Next.js 14+ (TypeScript) + Ruby on Rails 7+ + PostgreSQL  
**Foco:** SEO, Performance (Core Web Vitals), Escalabilidade

---

## 🏗️ Estrutura do Monorepo (Estado Atual)

```
AB0-1-main/
├── AB0-1-front/          # Next.js 14 Frontend (TypeScript)
│   ├── app/              # App Router (Next.js 14)
│   ├── components/       # Componentes React reutilizáveis
│   ├── lib/              # Utilitários e configurações
│   ├── public/           # Assets estáticos
│   ├── types/            # TypeScript interfaces
│   └── contexts/         # React Context (autenticação, etc)
│
├── AB0-1-back/           # Ruby on Rails 7 API
│   ├── app/
│   │   ├── models/       # ActiveRecord models
│   │   ├── controllers/  # API controllers (REST)
│   │   ├── serializers/  # ActiveModel Serializers
│   │   └── admin/        # ActiveAdmin dashboard
│   ├── config/           # Configurações Rails
│   ├── db/               # Migrations e seeds
│   └── spec/             # RSpec tests
│
├── docker-compose.yml    # Orquestração containers
├── .github/workflows/    # CI/CD (DigitalOcean deploy)
└── docs/                 # Documentação técnica
```

---

## 🔧 Stack Tecnológico Detalhado

### Frontend (AB0-1-front/)

**Framework:** Next.js 14.2.34 com App Router  
**Linguagem:** TypeScript 5.2.2  
**Styling:** Tailwind CSS 3.3.3 + Shadcn/UI (Radix UI)  
**State Management:** React Query (@tanstack/react-query 5.90)  
**Formulários:** React Hook Form 7.63 + Zod validation  
**Animações:** Framer Motion 12.26  
**Autenticação:** Better Auth 1.4.12  
**Monitoramento:** Sentry Next.js 8.0  

**Dependências-Chave:**
```json
{
  "next": "^14.2.34",
  "react": "^18.2.0",
  "typescript": "5.2.2",
  "@tanstack/react-query": "^5.90.12",
  "axios": "^1.12.2",
  "framer-motion": "^12.26.1",
  "recharts": "^2.12.7",
  "date-fns": "^3.6.0",
  "zod": "^3.25.76",
  "@sentry/nextjs": "^8.0.0"
}
```

### Backend (AB0-1-back/)

**Framework:** Ruby on Rails 7.0.8  
**Ruby Version:** 3.2+  
**Banco de Dados:** PostgreSQL (prod) / SQLite3 (dev)  
**Cache/Jobs:** Redis 5.0 + Sidekiq 7.0  
**Autenticação:** Devise + JWT 3.1  
**Admin Panel:** ActiveAdmin 3.2.0  
**Background Jobs:** Sidekiq Scheduler (cron jobs)  
**Rate Limiting:** Rack Attack  
**CORS:** Rack CORS  
**Monitoramento:** Sentry Rails, Scout APM, Yabeda Prometheus  

**Gems Essenciais:**
```ruby
gem 'rails', '~> 7.0.8'
gem 'pg'                                  # PostgreSQL
gem 'devise'                              # Autenticação
gem 'jwt', '~> 3.1'                       # JWT tokens
gem 'pundit'                              # Autorização
gem 'friendly_id', '~> 5.5'               # Slugs SEO-friendly
gem 'kaminari'                            # Paginação
gem 'pg_search', '~> 2.3'                 # Full-text search
gem 'active_model_serializers'            # JSON serialização
gem 'redis', '~> 5.0'                     # Cache
gem 'sidekiq', '~> 7.0'                   # Background jobs
gem 'rack-cors'                           # CORS
gem 'rack-attack'                         # Rate limiting
gem 'sentry-rails'                        # Error tracking
gem 'paper_trail', '~> 16.0'              # Audit trail
gem 'faker', '~> 3.5'                     # Seed data
gem 'rspec-rails', '~> 6.0'               # Testing
gem 'factory_bot_rails'                   # Test fixtures
gem 'bullet'                              # N+1 detection
```

---

## 📊 Modelos de Dados (Database Schema)

### Diagrama ER Simplificado

```
User (1) ───< (N) Review
  │
  └───< (N) Lead (cotação)
  
Company (1) ───< (N) Review
   │
   ├───< (N) Product
   └───< (1) CompanyProfile

Product (N) ───> (1) Category
   │
   └───< (N) ProductSpec

Post (Blog) (N) ───> (1) Category
   │
   └───< (N) Comment

LocalPage (SEO) (1) ───> (1) City/State
```

### Models Rails Detalhados

#### 1. User (Usuários e Admins)
```ruby
# app/models/user.rb
class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
  
  has_many :reviews, dependent: :nullify
  has_many :leads, dependent: :nullify
  has_many :comments, dependent: :nullify
  
  enum role: { user: 0, company_user: 1, admin: 2 }
  
  validates :email, presence: true, uniqueness: true
  validates :cpf, uniqueness: true, allow_nil: true
  
  # Métodos de autorização
  def admin?
    role == 'admin'
  end
end
```

**Migration:**
```ruby
create_table :users do |t|
  t.string :email, null: false
  t.string :encrypted_password, null: false
  t.string :name
  t.string :cpf
  t.integer :role, default: 0
  t.string :phone
  t.string :city
  t.string :state
  t.timestamps
end

add_index :users, :email, unique: true
add_index :users, :cpf, unique: true
```

#### 2. Company (Empresas de Energia Solar)
```ruby
# app/models/company.rb
class Company < ApplicationRecord
  extend FriendlyId
  friendly_id :name, use: :slugged
  
  has_many :products, dependent: :destroy
  has_many :reviews, dependent: :destroy
  has_one :company_profile, dependent: :destroy
  has_many_attached :images
  
  validates :name, presence: true, uniqueness: true
  validates :cnpj, uniqueness: true, allow_nil: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  
  # Full-text search
  include PgSearch::Model
  pg_search_scope :search_by_name_and_city,
    against: [:name, :city, :state],
    using: { tsearch: { prefix: true } }
  
  # Schema.org JSON-LD
  def schema_json_ld
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": city,
        "addressRegion": state
      },
      "telephone": phone,
      "aggregateRating": aggregate_rating_schema
    }
  end
  
  def aggregate_rating_schema
    return nil unless reviews.any?
    {
      "@type": "AggregateRating",
      "ratingValue": average_rating,
      "reviewCount": reviews.count
    }
  end
end
```

**Migration:**
```ruby
create_table :companies do |t|
  t.string :name, null: false
  t.string :slug, null: false
  t.string :cnpj
  t.string :email
  t.string :phone
  t.string :website
  t.text :description
  t.string :logo_url
  t.string :city
  t.string :state
  t.string :address
  t.decimal :latitude, precision: 10, scale: 6
  t.decimal :longitude, precision: 10, scale: 6
  t.boolean :verified, default: false
  t.integer :year_founded
  t.timestamps
end

add_index :companies, :slug, unique: true
add_index :companies, :cnpj, unique: true
add_index :companies, [:city, :state]
```

#### 3. Product (Painéis, Inversores, etc)
```ruby
# app/models/product.rb
class Product < ApplicationRecord
  extend FriendlyId
  friendly_id :name, use: :slugged
  
  belongs_to :company
  belongs_to :category
  has_many :product_specs, dependent: :destroy
  has_one_attached :image
  
  validates :name, presence: true
  validates :price, numericality: { greater_than: 0 }, allow_nil: true
  
  scope :featured, -> { where(featured: true) }
  scope :by_category, ->(category_id) { where(category_id: category_id) }
  
  # Schema.org Product
  def schema_json_ld
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": name,
      "description": description,
      "brand": company.name,
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": "BRL",
        "availability": "https://schema.org/InStock"
      }
    }
  end
end
```

**Migration:**
```ruby
create_table :products do |t|
  t.string :name, null: false
  t.string :slug
  t.references :company, null: false, foreign_key: true
  t.references :category, null: false, foreign_key: true
  t.text :description
  t.decimal :price, precision: 10, scale: 2
  t.decimal :power_rating, precision: 10, scale: 2 # watts
  t.string :manufacturer
  t.string :model_number
  t.integer :warranty_years
  t.boolean :featured, default: false
  t.string :image_url
  t.timestamps
end

add_index :products, :slug, unique: true
add_index :products, [:category_id, :featured]
```

#### 4. Category (Categorias de Produtos)
```ruby
# app/models/category.rb
class Category < ApplicationRecord
  extend FriendlyId
  friendly_id :name, use: :slugged
  
  has_many :products, dependent: :nullify
  has_many :posts, dependent: :nullify
  has_one_attached :icon
  
  validates :name, presence: true, uniqueness: true
  
  scope :active, -> { where(active: true) }
end
```

**Migration:**
```ruby
create_table :categories do |t|
  t.string :name, null: false
  t.string :slug, null: false
  t.text :description
  t.string :icon_url
  t.boolean :active, default: true
  t.integer :products_count, default: 0
  t.timestamps
end

add_index :categories, :slug, unique: true
```

#### 5. Review (Avaliações)
```ruby
# app/models/review.rb
class Review < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :company, counter_cache: true
  
  validates :rating, presence: true, inclusion: { in: 1..5 }
  validates :title, presence: true, length: { maximum: 100 }
  validates :content, presence: true, length: { minimum: 50 }
  
  after_save :update_company_rating
  
  private
  
  def update_company_rating
    company.update_average_rating!
  end
end
```

**Migration:**
```ruby
create_table :reviews do |t|
  t.references :user, foreign_key: true, null: true
  t.references :company, null: false, foreign_key: true
  t.integer :rating, null: false
  t.string :title
  t.text :content
  t.string :reviewer_name # Para reviews sem login
  t.string :reviewer_email
  t.boolean :verified_purchase, default: false
  t.boolean :approved, default: false
  t.timestamps
end

add_index :reviews, [:company_id, :approved]
add_index :reviews, :rating
```

#### 6. Post (Blog)
```ruby
# app/models/post.rb
class Post < ApplicationRecord
  extend FriendlyId
  friendly_id :title, use: :slugged
  
  belongs_to :category, optional: true
  belongs_to :author, class_name: 'User', optional: true
  has_many :comments, dependent: :destroy
  has_one_attached :featured_image
  
  validates :title, presence: true, uniqueness: true
  validates :content, presence: true
  validates :meta_description, length: { maximum: 160 }
  
  scope :published, -> { where(published: true).where('published_at <= ?', Time.current) }
  scope :recent, -> { order(published_at: :desc) }
  
  # Schema.org Article
  def schema_json_ld
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": meta_description,
      "author": {
        "@type": "Person",
        "name": author&.name || "Avalia Solar"
      },
      "datePublished": published_at&.iso8601,
      "dateModified": updated_at.iso8601
    }
  end
end
```

**Migration:**
```ruby
create_table :posts do |t|
  t.string :title, null: false
  t.string :slug, null: false
  t.text :content, null: false
  t.text :excerpt
  t.string :meta_title
  t.text :meta_description
  t.string :featured_image_url
  t.references :category, foreign_key: true
  t.references :author, foreign_key: { to_table: :users }
  t.boolean :published, default: false
  t.datetime :published_at
  t.integer :views_count, default: 0
  t.timestamps
end

add_index :posts, :slug, unique: true
add_index :posts, [:published, :published_at]
```

#### 7. LocalPage (Páginas SEO por Cidade)
```ruby
# app/models/local_page.rb
class LocalPage < ApplicationRecord
  extend FriendlyId
  friendly_id :full_location, use: :slugged
  
  validates :city, presence: true
  validates :state, presence: true
  validates :slug, uniqueness: true
  
  def full_location
    "#{city}-#{state}".parameterize
  end
  
  def nearby_companies
    Company.where(city: city, state: state).limit(10)
  end
  
  # Schema.org LocalBusiness list
  def schema_json_ld
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": nearby_companies.map.with_index do |company, index|
        {
          "@type": "ListItem",
          "position": index + 1,
          "item": company.schema_json_ld
        }
      end
    }
  end
end
```

**Migration:**
```ruby
create_table :local_pages do |t|
  t.string :city, null: false
  t.string :state, null: false
  t.string :slug, null: false
  t.text :content
  t.string :meta_title
  t.text :meta_description
  t.decimal :latitude, precision: 10, scale: 6
  t.decimal :longitude, precision: 10, scale: 6
  t.integer :population
  t.timestamps
end

add_index :local_pages, :slug, unique: true
add_index :local_pages, [:city, :state], unique: true
```

#### 8. Lead (Cotações)
```ruby
# app/models/lead.rb
class Lead < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :company, optional: true
  
  validates :name, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :phone, presence: true
  validates :consumption_kwh, numericality: { greater_than: 0 }, allow_nil: true
  
  enum status: { pending: 0, contacted: 1, converted: 2, lost: 3 }
  
  after_create :send_to_companies
  
  private
  
  def send_to_companies
    LeadDistributionJob.perform_later(id)
  end
end
```

**Migration:**
```ruby
create_table :leads do |t|
  t.references :user, foreign_key: true, null: true
  t.references :company, foreign_key: true, null: true
  t.string :name, null: false
  t.string :email, null: false
  t.string :phone, null: false
  t.string :city
  t.string :state
  t.decimal :consumption_kwh, precision: 10, scale: 2
  t.decimal :average_bill, precision: 10, scale: 2
  t.text :message
  t.integer :status, default: 0
  t.timestamps
end

add_index :leads, :email
add_index :leads, [:status, :created_at]
```

---

## 🔌 API RESTful Endpoints

### Base URL
- **Desenvolvimento:** `http://localhost:3001/api/v1`
- **Produção:** `https://api.avaliasolar.com.br/api/v1`

### Autenticação
```ruby
# POST /api/v1/auth/signup
{
  "user": {
    "email": "user@example.com",
    "password": "senha123",
    "name": "João Silva"
  }
}

# POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "senha123"
}
# Response: { "token": "jwt_token", "user": {...} }

# GET /api/v1/auth/me
# Headers: Authorization: Bearer <token>
```

### Companies
```ruby
# GET /api/v1/companies
# Query params: ?page=1&per_page=20&city=Florianopolis&state=SC

# GET /api/v1/companies/:slug
# Response:
{
  "id": 1,
  "name": "WEG Solar",
  "slug": "weg-solar",
  "city": "Jaraguá do Sul",
  "state": "SC",
  "description": "...",
  "average_rating": 4.5,
  "reviews_count": 42,
  "products_count": 15,
  "verified": true,
  "schema_json_ld": {...}
}

# POST /api/v1/companies (Admin only)
# PUT /api/v1/companies/:id (Admin only)
```

### Products
```ruby
# GET /api/v1/products
# Query params: ?category=paineis-solares&featured=true

# GET /api/v1/products/:slug
# GET /api/v1/products/compare?ids[]=1&ids[]=2&ids[]=3
```

### Reviews
```ruby
# GET /api/v1/companies/:company_slug/reviews

# POST /api/v1/companies/:company_slug/reviews
{
  "review": {
    "rating": 5,
    "title": "Excelente empresa",
    "content": "Instalaram meu sistema em 3 dias..."
  }
}
```

### Blog Posts
```ruby
# GET /api/v1/posts
# Query params: ?category=guias&page=1

# GET /api/v1/posts/:slug
```

### Local Pages
```ruby
# GET /api/v1/local/:state/:city
# Example: /api/v1/local/sc/florianopolis
```

### Leads
```ruby
# POST /api/v1/leads
{
  "lead": {
    "name": "Maria Santos",
    "email": "maria@example.com",
    "phone": "(48) 99999-9999",
    "city": "Florianópolis",
    "state": "SC",
    "consumption_kwh": 350,
    "message": "Quero orçamento para residência"
  }
}
```

---

## 🎨 Frontend - Estrutura de Componentes

### Componentes Principais (app/components/)

#### 1. Layout Components
```typescript
// components/layout/Header.tsx
interface HeaderProps {
  user?: User;
  transparent?: boolean;
}

export function Header({ user, transparent }: HeaderProps) {
  return (
    <header className={cn(
      "fixed top-0 w-full z-50 transition-all",
      transparent ? "bg-transparent" : "bg-white shadow-md"
    )}>
      <nav>
        <Logo />
        <Navigation />
        <UserMenu user={user} />
        <CTAButton>Solicitar Orçamento</CTAButton>
      </nav>
    </header>
  );
}
```

#### 2. Company Components
```typescript
// components/company/CompanyCard.tsx
interface CompanyCardProps {
  company: Company;
  showCTA?: boolean;
}

export function CompanyCard({ company, showCTA }: CompanyCardProps) {
  return (
    <Card>
      <CardHeader>
        <Image src={company.logo_url} alt={company.name} />
        <Badge variant={company.verified ? "success" : "default"}>
          {company.verified ? "Verificada" : "Não verificada"}
        </Badge>
      </CardHeader>
      <CardContent>
        <h3>{company.name}</h3>
        <StarRating rating={company.average_rating} />
        <p>{company.reviews_count} avaliações</p>
      </CardContent>
      {showCTA && (
        <CardFooter>
          <Button>Ver Perfil</Button>
          <Button variant="outline">Solicitar Orçamento</Button>
        </CardFooter>
      )}
    </Card>
  );
}
```

#### 3. Product Comparator
```typescript
// components/product/ProductComparator.tsx
interface Product {
  id: number;
  name: string;
  price: number;
  power_rating: number;
  warranty_years: number;
  specs: ProductSpec[];
}

export function ProductComparator({ products }: { products: Product[] }) {
  const specs = useComparatorSpecs(products);
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th>Especificação</th>
            {products.map(p => (
              <th key={p.id}>{p.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {specs.map(spec => (
            <tr key={spec.name}>
              <td>{spec.label}</td>
              {products.map(p => (
                <td key={p.id}>{getSpecValue(p, spec.name)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### 4. Calculadora de Payback
```typescript
// components/calculator/PaybackCalculator.tsx
interface CalculatorState {
  consumption: number; // kWh/mês
  tariff: number;      // R$/kWh
  systemCost: number;  // R$
  city: string;
}

export function PaybackCalculator() {
  const [state, setState] = useState<CalculatorState>({
    consumption: 350,
    tariff: 0.85,
    systemCost: 15000,
    city: ''
  });
  
  const results = usePaybackCalculation(state);
  
  return (
    <Card>
      <CardHeader>
        <h2>Calcule seu Retorno de Investimento</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Slider
            label="Consumo Mensal (kWh)"
            value={state.consumption}
            onChange={(v) => setState({...state, consumption: v})}
            min={100}
            max={1000}
            step={50}
          />
          <Input
            label="Tarifa Energética (R$/kWh)"
            type="number"
            value={state.tariff}
            onChange={(e) => setState({...state, tariff: parseFloat(e.target.value)})}
          />
          <Select
            label="Cidade"
            options={cities}
            value={state.city}
            onChange={(v) => setState({...state, city: v})}
          />
        </div>
        
        <Separator className="my-6" />
        
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="Economia Mensal"
            value={`R$ ${results.monthlySavings.toFixed(2)}`}
            icon={<TrendingUp />}
          />
          <MetricCard
            label="Payback"
            value={`${results.paybackYears.toFixed(1)} anos`}
            icon={<Calendar />}
          />
          <MetricCard
            label="Economia em 25 anos"
            value={`R$ ${results.totalSavings.toFixed(0)}`}
            icon={<DollarSign />}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function usePaybackCalculation(state: CalculatorState) {
  return useMemo(() => {
    const monthlySavings = state.consumption * state.tariff * 0.95; // 95% de economia
    const annualSavings = monthlySavings * 12;
    const paybackYears = state.systemCost / annualSavings;
    const totalSavings = annualSavings * 25 - state.systemCost;
    
    return {
      monthlySavings,
      annualSavings,
      paybackYears,
      totalSavings
    };
  }, [state]);
}
```

---

## 🚀 SEO & Performance - Implementação Completa

### 1. Meta Tags Dinâmicas (Next.js 14 Metadata API)

```typescript
// app/companies/[slug]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = await fetchCompany(params.slug);
  
  return {
    title: `${company.name} - Energia Solar | Avalia Solar`,
    description: company.description?.slice(0, 160),
    openGraph: {
      title: company.name,
      description: company.description,
      images: [company.logo_url],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: company.name,
      description: company.description
    },
    alternates: {
      canonical: `https://avaliasolar.com.br/companies/${company.slug}`
    }
  };
}
```

### 2. Schema.org JSON-LD

```typescript
// components/seo/SchemaMarkup.tsx
interface SchemaProps {
  type: 'Organization' | 'Product' | 'Review' | 'Article' | 'LocalBusiness';
  data: any;
}

export function SchemaMarkup({ type, data }: SchemaProps) {
  const schema = generateSchema(type, data);
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Uso em página:
<SchemaMarkup type="LocalBusiness" data={company.schema_json_ld} />
```

### 3. Sitemap Dinâmico

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [companies, products, posts, localPages] = await Promise.all([
    fetchCompanies(),
    fetchProducts(),
    fetchPosts(),
    fetchLocalPages()
  ]);
  
  return [
    {
      url: 'https://avaliasolar.com.br',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    ...companies.map(c => ({
      url: `https://avaliasolar.com.br/companies/${c.slug}`,
      lastModified: c.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    })),
    ...products.map(p => ({
      url: `https://avaliasolar.com.br/products/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.7
    })),
    ...posts.map(post => ({
      url: `https://avaliasolar.com.br/blog/${post.slug}`,
      lastModified: post.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.6
    })),
    ...localPages.map(page => ({
      url: `https://avaliasolar.com.br/local/${page.state}/${page.city}`,
      lastModified: page.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.5
    }))
  ];
}
```

### 4. Robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/_next/', '/login', '/signup']
    },
    sitemap: 'https://avaliasolar.com.br/sitemap.xml'
  };
}
```

### 5. Core Web Vitals - Otimizações

```typescript
// next.config.js
const nextConfig = {
  images: {
    domains: ['avaliasolar.com.br', 'api.avaliasolar.com.br'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  
  // Compressão
  compress: true,
  
  // Headers de cache
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },
  
  // Rewrites para API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*' // Dev
      }
    ];
  }
};
```

### 6. Lazy Loading de Imagens

```typescript
// components/ui/OptimizedImage.tsx
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  priority = false
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      className="object-cover"
    />
  );
}
```

---

## 📱 Páginas Principais - Estrutura

### 1. Homepage (app/page.tsx)

```typescript
export default async function HomePage() {
  const [featuredCompanies, categories, recentPosts] = await Promise.all([
    fetchFeaturedCompanies(),
    fetchCategories(),
    fetchRecentPosts(3)
  ]);
  
  return (
    <>
      <SchemaMarkup type="Organization" data={organizationSchema} />
      
      <Hero
        title="Compare Empresas de Energia Solar"
        subtitle="Encontre as melhores opções, preços e avaliações reais"
        cta={<QuoteButton />}
      />
      
      <CategoriesGrid categories={categories} />
      
      <FeaturedCompaniesSection companies={featuredCompanies} />
      
      <PaybackCalculator />
      
      <RecentBlogPosts posts={recentPosts} />
      
      <Newsletter />
    </>
  );
}
```

### 2. Companies List (app/companies/page.tsx)

```typescript
interface SearchParams {
  city?: string;
  state?: string;
  rating?: string;
  page?: string;
}

export default async function CompaniesPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  const companies = await fetchCompanies(searchParams);
  
  return (
    <>
      <PageHeader
        title="Empresas de Energia Solar"
        description="Compare instaladoras verificadas com avaliações reais"
      />
      
      <FiltersBar
        filters={{
          city: searchParams.city,
          state: searchParams.state,
          rating: searchParams.rating
        }}
      />
      
      <CompaniesGrid companies={companies.data} />
      
      <Pagination
        currentPage={parseInt(searchParams.page || '1')}
        totalPages={companies.totalPages}
      />
    </>
  );
}
```

### 3. Company Profile (app/companies/[slug]/page.tsx)

```typescript
export default async function CompanyProfilePage({
  params
}: {
  params: { slug: string }
}) {
  const company = await fetchCompany(params.slug);
  const reviews = await fetchCompanyReviews(params.slug);
  const products = await fetchCompanyProducts(params.slug);
  
  return (
    <>
      <SchemaMarkup type="LocalBusiness" data={company.schema_json_ld} />
      
      <CompanyHeader company={company} />
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações ({reviews.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <CompanyOverview company={company} />
        </TabsContent>
        
        <TabsContent value="products">
          <ProductsGrid products={products} />
        </TabsContent>
        
        <TabsContent value="reviews">
          <ReviewsList reviews={reviews} />
          <ReviewForm companySlug={params.slug} />
        </TabsContent>
      </Tabs>
      
      <QuoteFormSection companyId={company.id} />
    </>
  );
}
```

### 4. Products (app/products/page.tsx)

```typescript
export default async function ProductsPage({
  searchParams
}: {
  searchParams: { category?: string; compare?: string }
}) {
  const products = await fetchProducts(searchParams);
  const compareIds = searchParams.compare?.split(',') || [];
  
  return (
    <>
      <PageHeader title="Produtos de Energia Solar" />
      
      {compareIds.length > 0 && (
        <ProductComparator productIds={compareIds} />
      )}
      
      <CategoryFilter />
      
      <ProductsGrid
        products={products}
        compareMode={compareIds.length > 0}
      />
    </>
  );
}
```

### 5. Blog (app/blog/page.tsx & app/blog/[slug]/page.tsx)

```typescript
// Lista de posts
export default async function BlogPage({
  searchParams
}: {
  searchParams: { category?: string; page?: string }
}) {
  const posts = await fetchPosts(searchParams);
  
  return (
    <>
      <BlogHeader />
      <CategoryNav categories={await fetchCategories()} />
      <BlogGrid posts={posts.data} />
      <Pagination {...posts.pagination} />
    </>
  );
}

// Post individual
export default async function BlogPostPage({
  params
}: {
  params: { slug: string }
}) {
  const post = await fetchPost(params.slug);
  
  return (
    <article>
      <SchemaMarkup type="Article" data={post.schema_json_ld} />
      
      <PostHeader
        title={post.title}
        author={post.author}
        publishedAt={post.published_at}
      />
      
      <FeaturedImage src={post.featured_image_url} alt={post.title} />
      
      <PostContent content={post.content} />
      
      <ShareButtons url={`/blog/${post.slug}`} />
      
      <RelatedPosts posts={post.related_posts} />
      
      <CommentsSection postId={post.id} />
    </article>
  );
}
```

### 6. Local Pages (app/local/[state]/[city]/page.tsx)

```typescript
export default async function LocalPage({
  params
}: {
  params: { state: string; city: string }
}) {
  const localPage = await fetchLocalPage(params.state, params.city);
  const companies = await fetchCompaniesByLocation(params.state, params.city);
  
  return (
    <>
      <SchemaMarkup type="LocalBusiness" data={localPage.schema_json_ld} />
      
      <LocalHeader
        city={localPage.city}
        state={localPage.state}
        population={localPage.population}
      />
      
      <GoogleMap
        center={{ lat: localPage.latitude, lng: localPage.longitude }}
        markers={companies.map(c => ({
          lat: c.latitude,
          lng: c.longitude,
          label: c.name
        }))}
      />
      
      <LocalContent content={localPage.content} />
      
      <CompaniesInCity companies={companies} city={localPage.city} />
      
      <LocalStats city={localPage.city} />
      
      <QuoteFormLocal location={`${localPage.city}, ${localPage.state}`} />
    </>
  );
}
```

---

## 🔐 Autenticação e Autorização

### Backend (Rails + Devise + JWT)

```ruby
# app/controllers/api/v1/auth_controller.rb
class Api::V1::AuthController < ApplicationController
  skip_before_action :authenticate_user!, only: [:login, :signup]
  
  def signup
    user = User.new(user_params)
    
    if user.save
      token = JwtService.encode(user_id: user.id)
      render json: {
        token: token,
        user: UserSerializer.new(user)
      }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  def login
    user = User.find_by(email: params[:email])
    
    if user&.valid_password?(params[:password])
      token = JwtService.encode(user_id: user.id)
      render json: {
        token: token,
        user: UserSerializer.new(user)
      }
    else
      render json: { error: 'Credenciais inválidas' }, status: :unauthorized
    end
  end
  
  def me
    render json: UserSerializer.new(current_user)
  end
  
  private
  
  def user_params
    params.require(:user).permit(:email, :password, :name, :phone)
  end
end

# lib/jwt_service.rb
class JwtService
  SECRET_KEY = Rails.application.credentials.secret_key_base
  
  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY, 'HS256')
  end
  
  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: 'HS256' })[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError => e
    nil
  end
end
```

### Frontend (Next.js + Better Auth)

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { createAuthClient } from "better-auth/client";

export const auth = betterAuth({
  database: {
    provider: "pg",
    url: process.env.DATABASE_URL
  },
  emailAndPassword: {
    enabled: true
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  }
});

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

// Hook para autenticação
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    authClient.getSession().then(session => {
      setUser(session?.user || null);
    });
  }, []);
  
  return {
    user,
    login: authClient.signIn.email,
    logout: authClient.signOut,
    signup: authClient.signUp.email
  };
}
```

---

## 🧪 Testing Strategy

### Backend (RSpec)

```ruby
# spec/models/company_spec.rb
RSpec.describe Company, type: :model do
  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_uniqueness_of(:name) }
    it { should validate_uniqueness_of(:cnpj).allow_nil }
  end
  
  describe 'associations' do
    it { should have_many(:products) }
    it { should have_many(:reviews) }
  end
  
  describe '#schema_json_ld' do
    let(:company) { create(:company, :with_reviews) }
    
    it 'generates valid schema.org markup' do
      schema = company.schema_json_ld
      expect(schema[:'@type']).to eq('LocalBusiness')
      expect(schema[:aggregateRating]).to be_present
    end
  end
end

# spec/requests/api/v1/companies_spec.rb
RSpec.describe 'Api::V1::Companies', type: :request do
  describe 'GET /api/v1/companies' do
    let!(:companies) { create_list(:company, 3) }
    
    it 'returns paginated companies' do
      get '/api/v1/companies', params: { page: 1, per_page: 2 }
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(2)
      expect(json['meta']['total_pages']).to eq(2)
    end
  end
end
```

### Frontend (Jest + React Testing Library)

```typescript
// __tests__/components/CompanyCard.test.tsx
import { render, screen } from '@testing-library/react';
import { CompanyCard } from '@/components/company/CompanyCard';

describe('CompanyCard', () => {
  const mockCompany = {
    id: 1,
    name: 'WEG Solar',
    slug: 'weg-solar',
    average_rating: 4.5,
    reviews_count: 42,
    verified: true
  };
  
  it('renders company information correctly', () => {
    render(<CompanyCard company={mockCompany} />);
    
    expect(screen.getByText('WEG Solar')).toBeInTheDocument();
    expect(screen.getByText('42 avaliações')).toBeInTheDocument();
    expect(screen.getByText('Verificada')).toBeInTheDocument();
  });
  
  it('shows CTA buttons when showCTA is true', () => {
    render(<CompanyCard company={mockCompany} showCTA />);
    
    expect(screen.getByText('Ver Perfil')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Orçamento')).toBeInTheDocument();
  });
});
```

---

## 🚢 Deploy & Infrastructure

### Estrutura de Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: berviantoleo/railway-deploy@v1
        with:
          service: backend
          token: ${{ secrets.RAILWAY_TOKEN }}
          
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Variáveis de Ambiente

#### Backend (.env.production)
```bash
RAILS_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/avaliasolar_prod
REDIS_URL=redis://host:6379/0
SECRET_KEY_BASE=<generated_secret>

# JWT
JWT_SECRET_KEY=<generated_secret>

# CORS
FRONTEND_URL=https://avaliasolar.com.br

# Email (SendGrid/AWS SES)
SMTP_ADDRESS=smtp.sendgrid.net
SMTP_USERNAME=apikey
SMTP_PASSWORD=<sendgrid_api_key>

# Storage (AWS S3)
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=sa-east-1
AWS_BUCKET=avaliasolar-uploads

# Monitoring
SENTRY_DSN=<sentry_dsn>
SCOUT_KEY=<scout_key>
```

#### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://api.avaliasolar.com.br
NEXT_PUBLIC_SITE_URL=https://avaliasolar.com.br
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Auth
NEXTAUTH_SECRET=<generated_secret>
GOOGLE_CLIENT_ID=<google_oauth_id>
GOOGLE_CLIENT_SECRET=<google_oauth_secret>

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<maps_api_key>

# Sentry
NEXT_PUBLIC_SENTRY_DSN=<sentry_dsn>
```

---

## 📊 Monitoramento e Analytics

### 1. Google Analytics 4

```typescript
// lib/gtag.ts
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url
  });
};

export const event = ({ action, category, label, value }: GtagEvent) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value
  });
};

// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Sentry Error Tracking

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.NODE_ENV
});
```

---

## 📚 Próximos Passos - Roadmap

### Phase 1: MVP (Semanas 1-4)
- [x] Estrutura base frontend/backend
- [ ] Corrigir 404s (/products, /blog)
- [ ] Implementar models principais (Company, Product, Post)
- [ ] API CRUD básico
- [ ] Homepage funcional com CTAs
- [ ] Formulário de leads
- [ ] Sitemap.xml e robots.txt
- [ ] Meta tags dinâmicas

### Phase 2: SEO & Content (Semanas 5-8)
- [ ] Schema.org em todas as páginas
- [ ] 20 páginas locais (SC, PR, RS)
- [ ] 10 posts de blog SEO-optimized
- [ ] Calculadora de payback
- [ ] Otimização de imagens (WebP)
- [ ] Google Search Console setup
- [ ] Core Web Vitals < 2.5s

### Phase 3: Features Avançadas (Semanas 9-12)
- [ ] Sistema de reviews
- [ ] Comparador de produtos
- [ ] Filtros avançados
- [ ] Dashboard para empresas parceiras
- [ ] Integração WhatsApp
- [ ] Sistema de notificações (Sidekiq)
- [ ] Testes E2E (Playwright)

### Phase 4: Growth & Scale (Mês 4+)
- [ ] Expansão nacional (todas UFs)
- [ ] API pública para parceiros
- [ ] Programa de afiliados
- [ ] Mobile app (React Native)
- [ ] A/B testing framework
- [ ] Advanced analytics

---

## 🎯 KPIs e Métricas de Sucesso

### SEO
- [ ] LCP < 2.5s (Google PageSpeed)
- [ ] INP < 200ms
- [ ] CLS < 0.1
- [ ] 100 páginas indexadas no Google (3 meses)
- [ ] 20+ backlinks de qualidade
- [ ] Domain Authority > 30

### Business
- [ ] 100 leads/mês (6 meses)
- [ ] 10 empresas parceiras cadastradas
- [ ] 50 produtos no catálogo
- [ ] 100 reviews de usuários
- [ ] 10k visitantes/mês (6 meses)

---

## 📖 Como Começar (Quick Start)

### Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/AB0-1-main.git
cd AB0-1-main

# Backend (Terminal 1)
cd AB0-1-back
bundle install
rails db:create db:migrate db:seed
rails s -p 3001

# Frontend (Terminal 2)
cd AB0-1-front
npm install
npm run dev

# Acesse:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api/v1
# Admin: http://localhost:3001/admin
```

### Docker (Recomendado)

```bash
docker-compose up -d
docker-compose exec backend rails db:migrate db:seed

# Acesse:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

---

## 📞 Suporte e Contato

**Documentação Completa:** [docs/README.md](docs/README.md)  
**Issues:** GitHub Issues  
**Email:** contato@avaliasolar.com.br  

---

**Última Atualização:** 2026-01-19  
**Versão:** 2.0.0
