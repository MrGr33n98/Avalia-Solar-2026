# Relatório Técnico: Funcionalidade de Blog (/blog)

Este documento detalha a arquitetura, arquivos e fluxo de dados da funcionalidade de Blog do sistema Avalia Solar, cobrindo frontend (Next.js) e backend (Rails API).

## 1. Estrutura de Arquivos

### 1.1 Frontend (Next.js)
Caminho Base: `AB0-1-front/`

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `app/blog/page.tsx` | Page (Server Component) | Página principal de listagem. Busca artigos e categorias via API. Implementa filtros e paginação. |
| `app/blog/[slug]/page.tsx` | Page (Server Component) | Página de detalhe do artigo. Gera metadados SEO, exibe conteúdo HTML e artigos relacionados. |
| `components/BlogCard.tsx` | Component | Card reutilizável para exibir resumo do artigo em listas. |
| `components/ArticleBanner.tsx` | Component | Banner principal do artigo com título e imagem de fundo. |
| `components/ArticleConversionSection.tsx` | Component | Seção de CTA (Call to Action) exibida ao final do artigo. |
| `components/AuthorAvatarFloating.tsx` | Component | Avatar do autor que acompanha a rolagem (desktop). |
| `lib/api-config.ts` | Utility | Utilitário para construção de URLs da API (`buildApiUrl`). |
| `utils/image.ts` | Utility | Helper para tratamento de URLs de imagens (`getFullImageUrl`). |

### 1.2 Backend (Ruby on Rails)
Caminho Base: `AB0-1-back/`

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `config/routes.rb` | Config | Define rotas da API (`namespace :api do namespace :v1 ...`). |
| `app/controllers/api/v1/articles_controller.rb` | Controller | Gerencia requisições CRUD e de leitura pública para artigos. Implementa cache e paginação. |
| `app/models/article.rb` | Model | Modelo de dados. Contém validações, relacionamentos e lógica de anexos (ActiveStorage). |
| `app/models/category.rb` | Model | Modelo de categoria, usado para categorizar artigos. |
| `app/serializers/article_serializer.rb` | Serializer | (Inferido) Define o formato JSON de resposta dos artigos. |

## 2. Diagrama de Dependências e Fluxo

```mermaid
graph TD
    User((Usuário))
    
    subgraph Frontend [Next.js App Router]
        BlogPage[app/blog/page.tsx]
        ArticlePage[app/blog/[slug]/page.tsx]
        BlogCard[components/BlogCard]
    end
    
    subgraph Backend [Rails API]
        Route[GET /api/v1/articles]
        Controller[ArticlesController]
        Model[Article Model]
        DB[(PostgreSQL)]
    end

    User -->|Acessa /blog| BlogPage
    User -->|Clica em Artigo| ArticlePage
    
    BlogPage -->|Fetch API| Route
    ArticlePage -->|Fetch API| Route
    
    Route --> Controller
    Controller -->|Query| Model
    Model -->|SQL| DB
    
    Controller -->|JSON| BlogPage
    Controller -->|JSON| ArticlePage
```

## 3. Fluxo de Dados Detalhado

### 3.1 Listagem de Artigos (`/blog`)
1.  **Frontend**: `BlogIndexPage` recebe `searchParams` (ex: `?category=1&page=2`).
2.  **API Call**: Executa `fetch(buildApiUrl('articles?category_id=1...'))`.
3.  **Backend**: 
    *   `ArticlesController#index` recebe a requisição.
    *   Verifica cache (`cached_json`).
    *   Filtra por `status: 'published'`, `category_id`, etc.
    *   Aplica paginação.
4.  **Resposta**: Retorna JSON com array `data` (artigos) e objeto `meta` (paginação).
5.  **Renderização**: Frontend mapeia o array `data` para componentes `BlogCard`.

### 3.2 Detalhe do Artigo (`/blog/:slug`)
1.  **Frontend**: `ArticlePage` recebe `params.slug`.
2.  **API Call**: 
    *   Busca artigo: `fetch(buildApiUrl('articles/:slug'))`.
    *   Busca relacionados: `fetch(buildApiUrl('articles/:slug/related'))`.
3.  **Backend**:
    *   `ArticlesController#show` busca o artigo por Slug (via FriendlyId) ou ID.
    *   Incrementa `views_count`.
    *   Retorna JSON detalhado.
4.  **Renderização**: 
    *   Gera metadados (OpenGraph, Title).
    *   Renderiza HTML do conteúdo usando `dangerouslySetInnerHTML`.

## 4. Configurações Relevantes

*   **Caching Backend**: O controller utiliza um helper `cached_json` com expiração de 15 minutos para listagem e 1 hora para detalhes.
*   **Revalidate Frontend**: O Next.js utiliza ISR (Incremental Static Regeneration) com `revalidate: 300` (5 min) para a home e `1800` (30 min) para artigos.
*   **Imagens**: As imagens são servidas via ActiveStorage e processadas pelo componente `Image` do Next.js.
*   **Slugs**: O backend utiliza a gem `friendly_id` para gerar URLs amigáveis baseadas no título.

## 5. Pontos de Melhoria Identificados

### 5.1 Frontend
*   **Busca**: O input de busca na página principal parece ser apenas visual no momento (não há form action visível no código analisado). **Sugestão**: Implementar funcionalidade de busca real enviando query params.
*   **Paginação**: A paginação na UI é básica (`Anterior`/`Próxima`). **Sugestão**: Implementar componente de paginação numerada para melhor UX.
*   **Loading States**: Não foram identificados Skeletons de carregamento explícitos para as chamadas assíncronas (Server Components bloqueiam a renderização até terminar). **Sugestão**: Adicionar `loading.tsx` nas rotas do blog.

### 5.2 Backend
*   **Sanitização**: O conteúdo HTML é renderizado diretamente no frontend. É crucial garantir que o backend sanitize este HTML (ex: gem `loofah` ou `sanitize`) antes de salvar no banco para prevenir XSS.
*   **N+1 Queries**: O controller usa `.includes(:category, :companies, :author, :company)`, o que é uma boa prática para evitar N+1 queries.
*   **Cache Invalidation**: A invalidação de cache no `update/destroy` usa `expire_articles_cache`, mas a estratégia de chave de cache no `index` baseada apenas em params pode ser melhorada usando `updated_at` da coleção mais recente.

## 6. Como Executar Localmente

Certifique-se de ter o backend e frontend rodando:

1.  **Backend**:
    ```bash
    cd AB0-1-back
    bundle install
    rails db:migrate
    rails s -p 3001
    ```

2.  **Frontend**:
    ```bash
    cd AB0-1-front
    npm install
    # Certifique-se que NEXT_PUBLIC_API_URL aponta para localhost:3001
    npm run dev
    ```

3.  Acesse: `http://localhost:3000/blog`


toolName: search_codebase
            
status: success
          
query: Find Active Admin configuration for Articles
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\app\admin\admin_users.rb
          
Based on the detailed analysis of the image and the codebase (specifically Active Admin configurations), here is the complete technical guide to managing the blog components.

### 1. Visual Analysis of Components

Below is the detailed breakdown of the visual elements identified in the image:

| Component | Type | Position | Function | Visual Properties |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | Text (H1) | Top (Hero Section) | Main identification of the blog section. | Large font, white text, bold, over dark background image. |
| **Search Bar** | Input Field | Hero Section (Center) | Allow users to search for articles. | White input with magnifying glass icon, rounded corners. |
| **Section Title** | Text (H2) | Body (Top Left) | Identifies the list of articles ("Últimos Artigos"). | Dark color, bold, medium size. |
| **Article Card** | Container | Grid (Body) | Represents a single blog post summary. | White card with shadow on hover, rounded corners. |
| **Card Image** | Image | Card (Top) | Visual representation of the article topic. | Aspect ratio ~16:9, full width of card. |
| **Card Title** | Link/Text (H3) | Card (Middle) | Link to the full article. | Bold, dark text, truncates after ~2 lines. |
| **Card Excerpt** | Text (Paragraph) | Card (Middle) | Brief summary of content. | Gray text, smaller font, truncates after ~3 lines. |
| **Card Meta** | Icons/Text | Card (Bottom) | Shows date, author, or likes. | Small icons, muted gray text. |
| **Author Avatar** | Image (Circle) | Author Section | Identifies the highlighted author. | Circular mask, centered. |
| **Author Name** | Text | Author Section | Name of the author. | Bold, centered below avatar. |
| **Newsletter Input** | Input Field | Footer/Sidebar | Email capture for subscriptions. | Standard input with "Subscribe" button. |

---

### 2. Configuration Guide via Active Admin

To replicate and manage this interface using the current backend, you will use two main sections of the admin panel: **Articles** and **Admin Users**.

#### 1. Accessing the Panel
*   **URL**: Go to `your-domain.com/admin` (locally: `http://localhost:3000/admin`).
*   **Login**: Use your admin credentials.
*   **Navigation**: Click on **"Articles"** in the top menu bar.

#### 2. Mapping Visual Components to Form Fields
When you click **"New Article"** or **"Edit"**, here is how the fields correspond to the visual design:

| Visual Element | Active Admin Field | Configuration / Notes |
| :--- | :--- | :--- |
| **Card Image** | `Banner` (File Input) | **Tab:** Conteúdo > Detalhes Principais.<br>**Action:** Upload image (JPEG/PNG).<br>**Tech Spec:** The code suggests **1200x630px**. The frontend will crop/resize this for the card thumbnail. |
| **Card Title** | `Title` (Text Input) | **Tab:** Conteúdo > Detalhes Principais.<br>**Action:** Type the full headline. This automatically generates the URL slug if left blank. |
| **Card Excerpt** | `Excerpt` (Text Area) | **Tab:** Conteúdo > Texto.<br>**Action:** Write a 2-3 sentence summary. This is exactly what appears on the card below the image. |
| **Card Meta (Date)** | `Published at` (Datepicker) | **Tab:** Conteúdo > Detalhes Principais.<br>**Action:** Select the date. Articles with future dates are scheduled; past dates appear immediately. |
| **Author Info** | `Author` (Dropdown) | **Tab:** Conteúdo > Detalhes Principais.<br>**Action:** Select the `AdminUser` (e.g., "João Silva"). This links the article to the author's profile photo. |
| **Article Body** | `Content` (Quill Editor) | **Tab:** Conteúdo > Texto.<br>**Action:** The full content that appears when the user clicks the card. Supports rich text (bold, headers, lists). |
| **Visibility** | `Status` (Select) | **Action:** Set to **"Published"** to make it visible in the grid. "Draft" hides it. |
| **Highlights** | `Featured` (Checkbox) | **Action:** Check this if you want the article to appear in special "Featured" slots (like the big hero cards in the second mockup). |

#### 3. Managing the "Author Section"
The image shows an author section ("João Silva"). This is managed separately:

1.  Navigate to **"Admin Users"** in the top menu.
2.  Edit the user corresponding to the author.
3.  **Avatar**: Upload a photo in the `Avatar photo` field. The system automatically processes it into a circular format as shown in the design.
4.  **Name**: Ensure the user's name/email is correct.

#### 4. How to Publish & Verify
1.  **Create**: Fill in the Title, upload a Banner, write an Excerpt, select an Author, and set Status to "Published".
2.  **Save**: Click "Create Article" or "Update Article".
3.  **Verify**:
    *   Go to the frontend URL: `http://localhost:3000/blog`.
    *   **Real-time check**: The new card should appear immediately in the "Últimos Artigos" grid.
    *   **Visual Check**: Ensure the image is not pixelated and the excerpt length looks balanced compared to other cards.

#### 5. Best Practices for Maintenance
*   **Image Consistency**: Always use landscape images (16:9 ratio) for the **Banner**. Vertical images will be cropped awkwardly in the card grid.
*   **Excerpt Length**: Keep the **Excerpt** between 120-160 characters. If you leave it empty, the design might break or look empty.
*   **SEO**: Always fill in the **Meta title** and **Meta description** in the "SEO" tab (even though invisible on the card) to ensure the blog ranks well on Google.

This setup ensures that the data entered in the backend perfectly feeds the Next.js frontend components identified in the image.