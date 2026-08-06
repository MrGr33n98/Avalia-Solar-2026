<!-- Hallmark · pre-emit critique: P4 H4 E4 S4 R4 V3 -->

# Auditoria E2E do Fluxo Empresa → Categoria → Catálogo — Avalia Solar

**Data:** 5 de agosto de 2026  
**Ambiente:** produção (`https://www.avaliasolar.com.br`)  
**Caso de teste real:** `https://www.avaliasolar.com.br/companies/weg` → dropdown *Produtos e Serviços* → `Carregadores Residenciais / Wallbox` → `https://www.avaliasolar.com.br/companies/weg/categories/carregadores-residenciais`  
**Método:** inspeção de código (Next.js App Router + Rails 7), análise de API, SEO, performance, acessibilidade e usabilidade. Nível de exigência: **AA+++**.

## Resumo executivo

O fluxo de navegação de uma empresa para uma categoria específica **funciona tecnicamente**, mas gera uma experiência de *empty state* desnecessária e prejudica SEO, conversão e percepção de qualidade. A página de categoria da empresa é Server-Side Rendered (SSR) com ISR, possui metatags, canonical, JSON-LD e breadcrumbs, o que é positivo. No entanto, **apresenta "0 produtos" para a WEG na categoria clicada** apesar da empresa ter produtos cadastrados na aba geral, o que indica desencontro entre as categorias atribuídas à empresa e as categorias atribuídas aos produtos.

**Nota geral atual: 58/100 — nível C+.**

| Dimensão | Nota | Diagnóstico |
| --- | ---: | --- |
| Arquitetura do fluxo | 6,5/10 | Rota dedicada, SSR/ISR, mas com payload duplicado e busca da empresa em dois passos |
| Integridade dos dados | 3/10 | Categorias da empresa ≠ categorias dos produtos; empty state frequente |
| UX do empty state | 5/10 | Mensagem clara, mas sem sugestão de produtos similares ou outras categorias |
| SEO técnico | 6,5/10 | Breadcrumb, canonical, title/description e ItemList presentes, mas com gaps |
| URLs amigáveis | 6/10 | Slug da categoria é amigável, mas a URL longa e com `/categories/` é redundante |
| Performance (frontend) | 5,5/10 | Client Component com state in-memory, sem virtualização, re-render em cada filtro |
| Performance (backend) | 5/10 | Query em duas etapas com `pluck` + `WHERE IN`; sem cache no endpoint |
| Acessibilidade (AA) | 5,5/10 | ARIA parcial, navegação por teclado OK, mas sem skip-link e com semântica quebrada |
| Testes E2E | 2/10 | Nenhum teste Playwright cobre o fluxo empresa → categoria |
| Conversão | 4/10 | CTAs de orçamento existem, mas não aproveitam o empty state para engajamento |

### Veredito

A página está indexável, mas **não é A/AA nem premium** enquanto:

1. uma categoria clicada da empresa puder resultar em "0 produtos";
2. o backend não validar consistência entre categorias da empresa e categorias dos produtos;
3. o catálogo não tiver cache, paginação nem fallback inteligente;
4. a URL não refletir melhor a hierarquia `empresa/categoria`;
5. não existirem testes E2E que garantam o fluxo crítico.

---

## 1. Fluxo atual ponta a ponta

```text
/companies/weg
  → CompanyProfileTabs (aba "Produtos e Serviços")
  → dropdown com company.categories (categories_companies)
  → clique em "Carregadores Residenciais / Wallbox"
  → /companies/weg/categories/carregadores-residenciais
  → Server Component: loadCatalog(companySlug, categorySlug)
  → GET /api/v1/companies/{id}/catalog?category=carregadores-residenciais
  → Rails: @company.categories.active.find_by(seo_url: ...)
  → filtra produtos da empresa ou vinculados que estejam nessa mesma categoria
  → renderiza CompanyCategoryCatalogPage
  → CatalogClient (filtro local, favoritos, CTA de orçamento)
```

### Arquivos envolvidos

| Camada | Arquivo | Responsabilidade |
| --- | --- | --- |
| Frontend (tab) | `AB0-1-front/app/companies/[id]/components/CompanyProfileTabs.tsx` | Renderiza dropdown de categorias da empresa |
| Frontend (shell) | `AB0-1-front/app/companies/[id]/components/CompanyProfileShell.tsx` | Agrupa hero, abas e conteúdo |
| Frontend (página) | `AB0-1-front/app/companies/[id]/categories/[categorySlug]/page.tsx` | SSR/ISR da página de categoria |
| Frontend (cliente) | `AB0-1-front/app/companies/[id]/categories/[categorySlug]/CatalogClient.tsx` | Busca local, favoritos, empty state |
| API client | `AB0-1-front/lib/api-client.ts` | `companiesApiSafe.getCatalog` |
| Helpers de URL | `AB0-1-front/lib/slug.ts` | `buildCompanyPath`, `buildProductPath` |
| Backend | `AB0-1-back/app/controllers/api/v1/companies_controller.rb#catalog` | Lógica de filtro de produtos/serviços |
| Rotas | `AB0-1-back/config/routes.rb:97` | `member { get :catalog }` |
| Modelos | `Product`, `Category`, `CompanyProduct`, `Company` | Relações HABTM |

---

## 2. Diagnóstico do problema "0 produtos"

### 2.1 O que acontece no backend

A ação `catalog` faz o seguinte:

```ruby
category = @company.categories.active.find_by(seo_url: category_value)
linked_ids = CompanyProduct.visible.where(company_id: @company.id).pluck(:product_id)
product_ids = Product.active_status
              .joins(:categories)
              .where(categories: { id: category.id })
              .where('products.id IN (?) OR products.company_id = ?', linked_ids.presence || [0], @company.id)
              .pluck(:id).uniq
```

**Significado:** a categoria vem das categorias atribuídas à **empresa** (`categories_companies`). Os produtos exibidos precisam pertencer à **mesma categoria** (`categories_products`) E serem da empresa ou vinculados a ela.

### 2.2 Por que a WEG mostra "0 produtos"

Na primeira screenshot, a aba "Produtos e Serviços" mostra **Weg Inversor** (R$ 2.000,00). Isso indica que a WEG tem produtos cadastrados. Na segunda screenshot, a categoria clicada foi **Carregadores Residenciais / Wallbox**, e o catálogo retorna **0 produtos**.

As causas prováveis são:

1. **O produto "Weg Inversor" está categorizado como "Inversores" ou "Energia Solar"**, não como "Carregadores Residenciais / Wallbox".
2. **A categoria "Carregadores Residenciais / Wallbox" está atribuída à empresa WEG** (`categories_companies`), mas nenhum produto da WEG está atribuído a essa categoria (`categories_products`).
3. **Não existe validação de consistência**: o sistema permite que uma empresa se anuncie em uma categoria sem ter produtos/serviços nela.

### 2.3 Impacto

- **Frustração do usuário:** clica em uma categoria esperando ver produtos e vê empty state.
- **Perda de credibilidade:** página indexável com "0 produtos" e "Catálogo em atualização".
- **SEO negativo:** thin content — páginas com pouco ou nenhum conteúdo indexáveis.
- **Conversão perdida:** o CTA de orçamento é genérico, não aproveita o interesse demonstrado.

### 2.4 Sugestão imediata de correção de dados

No ActiveAdmin ou painel da empresa:

1. Verificar se os produtos da WEG têm a categoria correta (`categories_products`).
2. Remover da WEG as categorias declaradas (`categories_companies`) que não possuem produtos/serviços vinculados.
3. Ou, alternativamente, criar produtos/serviços para as categorias declaradas.

---

## 3. Auditoria SEO

### 3.1 Pontos positivos

- `generateMetadata` retorna `title`, `description`, `canonical` e `openGraph`.
- Página SSR com ISR (`revalidate = 900`).
- Breadcrumb visual com `aria-label="Breadcrumb"`.
- JSON-LD `ItemList` com produtos mapeados.

### 3.2 Gaps identificados

| Item | Problema | Gravidade |
| --- | --- | --- |
| **Title/Description quando vazio** | Continua indexável mesmo com 0 produtos. Não há `noindex` para catálogos vazios. | Alta |
| **H1 vs H2** | H1 é o nome da empresa; H2 é o nome da categoria. A página de categoria deveria ter H1 com o nome da categoria. | Média |
| **Breadcrumb estruturado** | Apenas breadcrumb visual; falta `<BreadcrumbJsonLd>` ou `<BreadcrumbSchema>` da página de categoria da empresa. | Média |
| **Canonical dinâmico** | Usa `buildCompanyPath` + `/categories/${category.seo_url}`. OK, mas duplica possibilidade de `/categories/id` e `/categories/slug`. | Baixa |
| **Meta keywords** | Não preenchido. | Baixa |
| **Hreflang** | Não aplicável (só PT-BR), mas poderia ter `x-default`. | Baixa |
| **Open Graph image** | Não há imagem OG na página de categoria da empresa. | Média |
| **JSON-LD vazio** | ItemList com 0 itens é gerado. Schema.org desaconselha listas vazias. | Média |

### 3.3 Recomendações SEO

1. **Noindex para catálogos vazios**: se `products.length === 0 && services.length === 0`, retornar `robots: { index: false, follow: true }`.
2. **H1 com nome da categoria**: trocar hierarquia para `<h1>{category.name}</h1>` e subir o nome da empresa para breadcrumb ou subtítulo.
3. **Adicionar `<BreadcrumbJsonLd>`** com: Início > Empresas > [Categoria global] > [Empresa] > [Categoria da empresa].
4. **Condicionar ItemList**: só renderizar JSON-LD se houver produtos.
5. **OG image**: usar logo da empresa + categoria como fallback.

---

## 4. Auditoria de URLs amigáveis

### 4.1 URL atual

```
https://www.avaliasolar.com.br/companies/weg/categories/carregadores-residenciais
```

### 4.2 Problemas

1. **Segmento `/categories/` é redundante** quando já estamos dentro de `/companies/:slug/`.
2. **Slug da empresa em inglês**: `/companies/` poderia ser `/empresas/` para SEO local (já existe `/empresas`? Verificar rotas).
3. **Sem ID numérico na URL**: se houver conflito de slug de categoria, não há fallback. O slug `carregadores-residenciais` pode ser ambíguo.
4. **Inconsistência com categorias globais**: a categoria global fica em `/categories/:slug`, enquanto a categoria da empresa fica em `/companies/:slug/categories/:slug`. Essa dualidade confunde e dilui autoridade.

### 4.3 Sugestões de URL

| Opção | URL | Prós | Contras |
| --- | --- | --- | --- |
| A — Curta | `/empresas/weg/carregadores-residenciais` | Curta, semântica, melhor para SEO local | Possível conflito com abas |
| B — Sufixo `-categoria` | `/empresas/weg/carregadores-residenciais-categoria` | Evita conflito com slug de produto | Um pouco mais longa |
| C — Prefixo `produtos/` | `/empresas/weg/produtos/carregadores-residenciais` | Clara, fácil de escalar | Mais longa |
| D — Manter com ajustes | `/companies/weg/c/carregadores-residenciais` | Curta, preserva estrutura | Quebra links atuais se não houver redirect |

**Recomendação:** se for possível alterar rotas, adotar **Opção C** (`/empresas/weg/produtos/carregadores-residenciais`) e fazer **redirect 301** da URL antiga. Caso contrário, manter a URL atual mas adicionar `rel="canonical"` consistente.

---

## 5. Auditoria de Performance

### 5.1 Frontend

| Problema | Local | Impacto |
| --- | --- | --- |
| **Client Component desnecessariamente pesado** | `CatalogClient.tsx` | Filtro local, favoritos e estado em memória sem persistência. Favoritos são perdidos no refresh. |
| **Re-render a cada keystroke** | `onChange={(e) => setQuery(...)}` | Sem debounce; para catálogos pequenos é aceitável, mas não é escalável. |
| **Sem virtualização** | Grid de produtos | Para catálogos grandes (>50), layout shift e tempo de render. |
| **Imagem do produto** | `ProductCardEnhanced.tsx` | Usa `fill` + `sizes` corretos, mas placeholder SVG pode ser otimizado. |
| **Renderização condicional de serviços** | `CatalogClient.tsx` | Serviços renderizados antes de produtos; se houver muitos serviços, o usuário precisa scrollar para ver produtos. |

### 5.2 Backend

| Problema | Local | Impacto |
| --- | --- | --- |
| **Dupla consulta** | `pluck(:id)` seguido de `Product.where(id: product_ids)` | Custo de memória e round-trip extra. | 
| **Sem cache** | `companies#catalog` | Cada requisição SSR dispara query complexa. | 
| **Sem paginação** | Retorna todos os produtos de uma vez | Catálogos grandes geram payload enorme. | 
| **ORDER BY com Arel.sql** | `order(Arel.sql('products.featured DESC NULLS LAST, products.name ASC'))` | Funciona, mas `NULLS LAST` pode forçar full scan se não houver índice composto. | 

### 5.3 Índices verificados

Índices existentes cobrem `categories_products`, `company_products`, `categories.seo_url`, `products.status` e `products.company_id`. Não há índice composto único para o JOIN triplo (`status + company_id + category_id`), mas as consultas individuais estão cobertas.

### 5.4 Recomendações de performance

1. **Refatorar a query do catalog** para um único `SELECT DISTINCT` em vez de `pluck` + `WHERE IN`.
2. **Adicionar cache Rails** de 5-15 minutos na resposta do catalog, chaveada por `company_id/category_id`.
3. **Paginar** o catálogo no backend (ex: `?page=1&per_page=24`) e usar infinite scroll ou paginação clara no frontend.
4. **Usar debounce** no campo de busca.
5. **Persistir favoritos** em `localStorage` ou backend.

---

## 6. Auditoria de Acessibilidade (AA+++)

### 6.1 Pontos positivos

- Breadcrumb com `aria-label="Breadcrumb"`.
- Botões e links com `focus-visible:ring-2`.
- Ícones com `aria-hidden="true"`.
- Input de busca com `<span className="sr-only">Buscar nesta categoria</span>`.
- Seções de produtos/serviços com `aria-labelledby`.

### 6.2 Gaps identificados

| Critério | Problema | Nível |
| --- | --- | --- |
| **1.3.1 Info e Relações** | O dropdown de categorias usa `<div role="menu">` e `<Link role="menuitem">`, mas a relação pai-filho não é anunciada corretamente em todos os leitores de tela. | AA |
| **2.1.1 Teclado** | O dropdown desktop só abre no `group-hover`. Não há trigger explícito com `aria-expanded` nem abertura por Enter/Esc. | AA |
| **2.4.3 Sequência de foco** | Ao abrir o dropdown mobile, o foco não é movido para o primeiro item. | AA |
| **2.4.4 Propósito do link** | Vários links do dropdown têm o mesmo texto visível (nomes de categoria), mas estão em contexto diferente. OK, mas pode melhorar com `aria-label`. | A |
| **3.2.2 Ao receber entrada** | Clicar na aba "Produtos e Serviços" alterna a aba E abre o dropdown. Em mobile, isso pode ser confuso. | AA |
| **4.1.2 Nome, Função, Valor** | Os botões de aba usam `aria-pressed` em vez de `aria-selected` (padrão para tabs). | AA |

### 6.3 Recomendações de acessibilidade

1. Usar o padrão **ARIA Menu Button** ou **Disclosure Navigation** do W3C para o dropdown.
2. Adicionar `aria-expanded` no botão de "Produtos e Serviços" e gerenciar foco programaticamente.
3. Trocar `aria-pressed` por `aria-selected` nas abas e envolver em `role="tablist"`.
4. Adicionar **skip-link** para o conteúdo principal.
5. Garantir que o dropdown feche com `Esc` e com clique fora.

---

## 7. Auditoria E2E / Testes

### 7.1 Cobertura atual

Testes Playwright em `AB0-1-front/tests/e2e/`:
- `pricing.spec.ts`
- `financing-wizard.spec.ts`
- `dashboard.spec.ts`
- `ga4-tracking.spec.ts`
- `auth-logout.spec.ts`

**Nenhum teste cobre:**
- Navegação empresa → categoria.
- Empty state do catálogo.
- Filtro de busca dentro da categoria.
- CTA de orçamento a partir do catálogo.
- Metadados/JSON-LD da página de categoria.

### 7.2 Testes recomendados

```ts
// tests/e2e/company-category-catalog.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Fluxo Empresa → Categoria → Catálogo', () => {
  test('navega do perfil da WEG para categoria e exibe produtos ou empty state', async ({ page }) => {
    await page.goto('/companies/weg');
    await page.getByRole('button', { name: /produtos e serviços/i }).click();
    await page.getByRole('link', { name: /carregadores residenciais/i }).click();
    await expect(page).toHaveURL(/\/companies\/weg\/categories\/carregadores/);
    // Verifica H1 ou mensagem de catálogo vazio
    await expect(page.locator('h2')).toContainText(/carregadores residenciais/i);
  });

  test('página de categoria vazia possui noindex', async ({ page }) => {
    // Mock ou ambiente com categoria sem produtos
    await page.goto('/companies/weg/categories/categoria-sem-produtos');
    const meta = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(meta).toContain('noindex');
  });

  test('filtro local reduz lista de produtos', async ({ page }) => {
    await page.goto('/companies/weg/categories/energia-solar');
    await page.getByPlaceholder(/buscar nesta categoria/i).fill('inversor');
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1);
  });
});
```

---

## 8. Recomendações priorizadas

### P0 — Correção imediata (esta semana)

1. **Corrigir dados da WEG**: garantir que produtos estejam categorizados corretamente ou remover categorias vazias do perfil da empresa.
2. **Adicionar noindex para catálogos vazios** no `generateMetadata`.
3. **Evitar JSON-LD vazio** — não renderizar `ItemList` se não houver produtos.
4. **Adicionar testes E2E** para o fluxo crítico.

### P1 — Melhoria de UX/SEO (próximas 2 semanas)

5. **Trocar H1/H2** para priorizar o nome da categoria na página.
6. **Adicionar breadcrumb estruturado** (`BreadcrumbJsonLd`) à página de categoria da empresa.
7. **Melhorar empty state**: sugerir outras categorias da empresa com produtos e/ou produtos similares.
8. **Ajustar dropdown de categorias** para padrão ARIA Menu Button/Disclosure.

### P2 — Performance e arquitetura (próximo mês)

9. **Refatorar query do backend** para evitar `pluck` + `WHERE IN`.
10. **Adicionar cache** no endpoint `/api/v1/companies/:id/catalog`.
11. **Paginar** o catálogo no backend e frontend.
12. **Avaliar mudança de URL** para `/empresas/:slug/produtos/:category-slug` com redirect 301.

### P3 — Excelência (contínuo)

13. **OG image dinâmica** por categoria/empresa.
14. **Persistir favoritos**.
15. **Adicionar métricas Core Web Vitals** e monitoramento de empty states.

---

## 9. Como fazer aparecer os produtos da empresa na categoria

### Opção 1 — Correção de dados (mais rápida)

No painel/ActiveAdmin:
1. Acesse o produto "Weg Inversor".
2. Verifique as categorias atribuídas a ele (`categories_products`).
3. Se o usuário clicou em "Carregadores Residenciais / Wallbox", certifique-se de que existem produtos da WEG nessa categoria.
4. Remova da WEG (`categories_companies`) categorias sem produtos/serviços.

### Opção 2 — Mudança de comportamento (recomendada)

No backend, alterar o endpoint `catalog` para, quando não houver produtos na categoria exata, retornar **produtos da empresa em outras categorias relacionadas** como "sugestão", sinalizados no JSON:

```json
{
  "products": [],
  "suggested_products": [...],
  "services": [...],
  "related_categories": [...]
}
```

No frontend, o `CatalogClient` renderiza:
- produtos da categoria (se houver);
- ou um bloco "Outros produtos da WEG" com sugestões;
- ou, se realmente não houver nada, o empty state atual.

### Opção 3 — Página de categoria da empresa = todos os produtos filtrados

Outra abordagem é fazer a página de categoria mostrar **todos os produtos da empresa** e apenas **destacar/emphasize** os da categoria selecionada. Isso evita empty states, mas dilui o propósito da página.

**Recomendação combinada:** implementar **Opção 1** para dados legados e **Opção 2** para novas páginas, garantindo que o usuário nunca caia em um dead end.

---

## 10. Checklist de validação pós-implementação

- [ ] WEG (e outras empresas) não exibem categorias vazias no dropdown.
- [ ] Página de categoria sem produtos retorna `noindex`.
- [ ] JSON-LD só é gerado quando há produtos.
- [ ] H1 da página de categoria contém o nome da categoria.
- [ ] Breadcrumb estruturado está presente.
- [ ] Dropdown de categorias funciona com teclado e leitor de tela.
- [ ] Testes E2E passam em CI.
- [ ] Tempo de resposta do endpoint `catalog` < 200 ms (p95).
- [ ] Redirect 301 implementado se houver mudança de URL.
- [ ] Empty state sugere outras categorias/produtos da mesma empresa.

---

## Anexos

### A. Trecho da query do catalog (backend)

```ruby
# AB0-1-back/app/controllers/api/v1/companies_controller.rb:109-149
def catalog
  category_value = params[:category].presence
  category = if category_value.to_s.match?(/\A\d+\z/)
               @company.categories.active.find_by(id: category_value)
             else
               @company.categories.active.find_by(seo_url: category_value)
             end

  return render json: { error: 'Category not found for company' }, status: :not_found unless category

  linked_ids = CompanyProduct.visible.where(company_id: @company.id).pluck(:product_id)
  product_ids = Product.active_status
                .joins(:categories)
                .where(categories: { id: category.id })
                .where('products.id IN (?) OR products.company_id = ?', linked_ids.presence || [0], @company.id)
                .pluck(:id).uniq

  products = Product.where(id: product_ids)
             .includes(:brand, :company, :categories, company_products: :product_offers, images_attachments: :blob)
             .order(Arel.sql('products.featured DESC NULLS LAST, products.name ASC'))

  services = @company.company_services.visible.where(category_id: category.id).order(name: :asc)
  # ...render
end
```

### B. Trecho do metadata dinâmico (frontend)

```typescript
// AB0-1-front/app/companies/[id]/categories/[categorySlug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const catalog = await loadCatalog(params.id, params.categorySlug);
  if (!catalog) return { title: 'Catálogo não encontrado | Avalia Solar' };
  // title/description/canonical/og gerados aqui
}
```
