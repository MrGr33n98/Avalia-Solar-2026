---
quick_id: 260409-czz
type: execute
wave: 1
depends_on: []
autonomous: true
files_modified:
  - AB0-1-back/app/controllers/api/v1/products_controller.rb
  - AB0-1-back/app/mailers/user_mailer.rb
  - AB0-1-back/app/jobs/welcome_email_job.rb
  - AB0-1-back/app/controllers/users/omniauth_callbacks_controller.rb
  - AB0-1-front/lib/api-client.ts
  - AB0-1-front/hooks/useProducts.ts
  - AB0-1-front/app/products/page.tsx
  - AB0-1-front/app/companies/CompaniesPageClient.tsx

must_haves:
  truths:
    - "GET /api/v1/products?q=termo&sort=price_asc&page=1&per_page=12 retorna { data: [...], meta: { total, page, per_page, total_pages } }"
    - "Novo usuário OAuth recebe welcome email via WelcomeEmailJob (não duplicado)"
    - "Página /companies dispara page_view e filter_applied no GTM ao mudar filtros"
  artifacts:
    - path: "AB0-1-back/app/controllers/api/v1/products_controller.rb"
      provides: "index com q, category_id, sort, page, per_page + resposta paginada"
    - path: "AB0-1-back/app/mailers/user_mailer.rb"
      provides: "método welcome(user) com @frontend_url"
    - path: "AB0-1-back/app/controllers/users/omniauth_callbacks_controller.rb"
      provides: "WelcomeEmailJob.perform_later após OAuth novo usuário"
    - path: "AB0-1-front/hooks/useProducts.ts"
      provides: "params aceitos, useEffect com deps, retorna total/totalPages"
    - path: "AB0-1-front/app/companies/CompaniesPageClient.tsx"
      provides: "usePageTracking + track filter_applied"
  key_links:
    - from: "AB0-1-front/hooks/useProducts.ts"
      to: "AB0-1-back/app/controllers/api/v1/products_controller.rb"
      via: "productsApiSafe.getAll com params"
    - from: "AB0-1-back/app/controllers/users/omniauth_callbacks_controller.rb"
      to: "AB0-1-back/app/jobs/welcome_email_job.rb"
      via: "WelcomeEmailJob.perform_later(@user.id)"
---

<objective>
Implementar três melhorias independentes:
1. Busca/sort/paginação de produtos no backend com hook e página atualizados
2. Welcome email para novos usuários OAuth via WelcomeEmailJob
3. Analytics pageTracking + filter events na página /companies

Purpose: Mover filtering de client-side para server-side em /products, garantir onboarding via email para OAuth, e instrumentar /companies para analytics.
Output: Controller Rails com query params, hook useProducts com assinatura nova, CompaniesPageClient com tracking.
</objective>

<context>
@AB0-1-back/app/controllers/api/v1/products_controller.rb
@AB0-1-back/app/mailers/user_mailer.rb
@AB0-1-back/app/jobs/welcome_email_job.rb
@AB0-1-back/app/controllers/users/omniauth_callbacks_controller.rb
@AB0-1-front/lib/api-client.ts
@AB0-1-front/hooks/useProducts.ts
@AB0-1-front/app/products/page.tsx
@AB0-1-front/app/companies/CompaniesPageClient.tsx
@AB0-1-front/hooks/usePageTracking.ts

<interfaces>
<!-- usePageTracking já existe e é importado como: -->
import { usePageTracking } from '@/hooks/usePageTracking';
<!-- track está disponível via: -->
import { track } from '@/lib/analytics/consolidated';

<!-- WelcomeEmailJob já existe com queue :mailers, retry e discard_on.
     welcome_email_sent_at já está na tabela users (db/schema.rb confirmado).
     O WelcomeEmailJob já verifica user.welcome_email_sent_at antes de enviar
     mas NÃO faz update_column após enviar (linha está comentada no job). -->

<!-- welcome.html.erb e welcome.text.erb já existem em app/views/user_mailer/ -->

<!-- issue_oauth_tokens em omniauth_callbacks_controller.rb não chama WelcomeEmailJob ainda -->

<!-- productsApiSafe.getAll atualmente aceita: { category_id, company_id, featured, limit, include_specs }
     Não aceita: q, sort, page, per_page -->

<!-- useProducts atualmente: sem params, sem total, sem totalPages -->

<!-- products/page.tsx já usa usePageTracking. Faz filtering client-side via filteredProducts useMemo. -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Products backend search/sort/pagination + frontend api-client + useProducts</name>
  <files>
    AB0-1-back/app/controllers/api/v1/products_controller.rb
    AB0-1-front/lib/api-client.ts
    AB0-1-front/hooks/useProducts.ts
    AB0-1-front/app/products/page.tsx
  </files>
  <action>
**Rails — products_controller.rb `index` action:**

Substituir o bloco `index` atual (linhas 4-18) pela versão com:

```ruby
def index
  include_specs = ActiveModel::Type::Boolean.new.cast(params[:include_specs])
  scope = ::Product.includes(:company, :categories)

  # Filtros existentes
  scope = scope.where(company_id: params[:company_id]) if params[:company_id].present?

  # Busca textual — q busca em name e description (ILIKE para case-insensitive)
  if params[:q].present?
    q = "%#{params[:q].gsub('%', '\\%').gsub('_', '\\_')}%"
    scope = scope.where('products.name ILIKE ? OR products.description ILIKE ?', q, q)
  end

  # Filtro por category_id via join na tabela de junção
  if params[:category_id].present?
    scope = scope.joins(:categories).where(categories: { id: params[:category_id] }).distinct
  end

  # Ordenação
  scope = case params[:sort]
          when 'price_asc'   then scope.order(price: :asc)
          when 'price_desc'  then scope.order(price: :desc)
          when 'name_asc'    then scope.order(name: :asc)
          when 'rating_desc' then scope.order(average_rating: :desc)
          else scope.order(created_at: :desc)
          end

  # Paginação manual (evitar dependência de kaminari se não estiver no Gemfile)
  page     = [params[:page].to_i, 1].max
  per_page = [[params[:per_page].to_i, 1].max, 100].min
  per_page = 12 if per_page == 0

  total       = scope.count
  total_pages = (total.to_f / per_page).ceil
  paginated   = scope.limit(per_page).offset((page - 1) * per_page)

  render json: {
    data: paginated.map { |p| p.as_json(include_specs: include_specs) },
    meta: { total: total, page: page, per_page: per_page, total_pages: total_pages }
  }
rescue StandardError => e
  Rails.logger.error("Products error: #{e.message}")
  render json: { error: 'Erro interno no servidor' }, status: :internal_server_error
end
```

Nota: verificar se a coluna `average_rating` existe em products; se não existir, omitir o case `rating_desc` ou usar `created_at: :desc` como fallback sem erro.

**Frontend — api-client.ts:**

Atualizar a assinatura de `productsApiSafe.getAll` (linha 665) adicionando os novos params:

```typescript
getAll: async (params?: {
  category_id?: number;
  company_id?: number;
  featured?: boolean;
  limit?: number;
  include_specs?: boolean;
  q?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}): Promise<Product[]>
```

A implementação interna já usa `buildQueryParams(params || {})`, então apenas a assinatura de tipo precisa ser atualizada — os novos params serão automaticamente incluídos na query string.

**Frontend — hooks/useProducts.ts:**

Reescrever completamente para aceitar params e expor paginação:

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/lib/api';
import { productsApiSafe } from '@/lib/api-client';

interface UseProductsParams {
  q?: string;
  category_id?: number;
  company_id?: number;
  sort?: string;
  page?: number;
  per_page?: number;
  include_specs?: boolean;
}

export function useProducts(params?: UseProductsParams) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtersMeta, setFiltersMeta] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const [rawData, filters] = await Promise.all([
          (productsApiSafe as any)._getAllRaw
            ? (productsApiSafe as any)._getAllRaw({ include_specs: true, ...params })
            : fetch(`/api/products`), // fallback — substituído abaixo
          productsApiSafe.getFilters()
        ]);
        // rawData via fetchApiSafe já retorna o objeto completo { data, meta }
        // mas productsApiSafe.getAll só retorna o array. Precisamos do objeto bruto.
        // Ver nota de implementação abaixo.
        if (!cancelled) {
          setFiltersMeta(filters?.filters || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching products:', err);
          setError((err as any)?.message || 'An unknown error occurred');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, [
    params?.q,
    params?.category_id,
    params?.company_id,
    params?.sort,
    params?.page,
    params?.per_page,
  ]);

  return { products, filtersMeta, loading, error, total, totalPages };
}
```

NOTA IMPORTANTE: `productsApiSafe.getAll` faz unwrap para `response.data` e descarta `meta`. Para expor `total` e `totalPages`, adicionar um método interno `_getAllPaginated` em `api-client.ts` paralelo ao `getAll`:

```typescript
// Adicionar dentro de productsApiSafe, após getAll:
_getAllPaginated: async (params?: {
  category_id?: number; company_id?: number; featured?: boolean;
  limit?: number; include_specs?: boolean; q?: string;
  sort?: string; page?: number; per_page?: number;
}): Promise<{ data: Product[]; meta: { total: number; page: number; per_page: number; total_pages: number } }> => {
  try {
    const url = `products${buildQueryParams(params || {})}`;
    const response = await fetchApiSafe<any>(url);
    if (response && Array.isArray(response.data)) {
      return { data: response.data, meta: response.meta || { total: response.data.length, page: 1, per_page: response.data.length, total_pages: 1 } };
    }
    if (Array.isArray(response)) {
      return { data: response, meta: { total: response.length, page: 1, per_page: response.length, total_pages: 1 } };
    }
    return { data: [], meta: { total: 0, page: 1, per_page: 12, total_pages: 0 } };
  } catch (error) {
    console.error('Error fetching products paginated:', error);
    return { data: [], meta: { total: 0, page: 1, per_page: 12, total_pages: 0 } };
  }
},
```

Depois reescrever `useProducts` para chamar `productsApiSafe._getAllPaginated` e usar `meta.total` / `meta.total_pages` para alimentar `total` e `totalPages`.

**Frontend — app/products/page.tsx:**

Atualizar o call do hook na linha 28 para passar params do URL:

```typescript
const { products, filtersMeta, loading, error, total, totalPages: backendTotalPages } = useProducts({
  q: searchQuery || undefined,
  category_id: filters.category !== 'all' ? Number(filters.category) : undefined,
  company_id: filters.company !== 'all' ? Number(filters.company) : undefined,
  sort: filters.sort !== 'relevance' ? filters.sort : undefined,
  page: currentPage,
  per_page: itemsPerPage,
  include_specs: true,
});
```

Substituir `filteredProducts` useMemo que fazia filtering de nome/description/category/company por apenas o sorting de specs que ainda não tem equivalente no backend (spec filters dinâmicos). O `products` já vem filtrado do backend. Remover os cases `price_asc`, `price_desc`, `name_asc` do sort client-side (passados ao backend). Manter apenas o `rating_desc` client-side se a coluna não existir no backend.

Substituir `totalPages = Math.ceil(filteredProducts.length / itemsPerPage)` por `totalPages = backendTotalPages`.
  </action>
  <verify>
    <automated>cd /c/Users/Bobi/Desktop/AB0-1-main/AB0-1-back && ruby -e "require_relative 'config/environment'; puts Product.respond_to?(:all)" 2>/dev/null || echo "verify manually: curl 'http://localhost:3001/api/v1/products?q=solar&sort=price_asc&page=1&per_page=3' and confirm { data: [...], meta: { total, page, per_page, total_pages } }"</automated>
  </verify>
  <done>
    - GET /api/v1/products?q=solar retorna { data: [...], meta: { total: N, page: 1, per_page: 12, total_pages: M } }
    - GET /api/v1/products?sort=price_asc retorna produtos ordenados por preço crescente
    - GET /api/v1/products?page=2&per_page=5 retorna segunda página com 5 itens
    - useProducts({ q: 'painel' }) re-fetcha quando q muda
    - products/page.tsx não faz mais filtering client-side de nome/categoria/empresa (delegado ao backend)
    - total e totalPages refletem valores do meta da API
  </done>
</task>

<task type="auto">
  <name>Task 2: Welcome email para novos usuários OAuth</name>
  <files>
    AB0-1-back/app/mailers/user_mailer.rb
    AB0-1-back/app/jobs/welcome_email_job.rb
    AB0-1-back/app/controllers/users/omniauth_callbacks_controller.rb
  </files>
  <action>
**1. user_mailer.rb — adicionar método `welcome`:**

Após o método `reset_password_instructions` (linha 42), adicionar:

```ruby
def welcome(user)
  @user = user
  @frontend_url = ENV.fetch('FRONTEND_URL', 'https://avaliasolar.com.br')
  @login_url = "#{@frontend_url}/login"
  mail(to: @user.email, subject: 'Bem-vindo ao Avalia Solar! ☀️')
end
```

O template `welcome.html.erb` já existe em `app/views/user_mailer/welcome.html.erb` e usa `@user` e `@login_url`. Não criar novo template.

**2. welcome_email_job.rb — descomentar `update_column`:**

Na linha 25 do job, a linha `# user.update_column(:welcome_email_sent_at, Time.current)` está comentada. Descomentar para que o job marque o envio e evite duplicatas:

```ruby
UserMailer.welcome(user).deliver_later

# Mark as sent
user.update_column(:welcome_email_sent_at, Time.current)
```

**3. omniauth_callbacks_controller.rb — disparar job após criação de novo usuário:**

Em `issue_oauth_tokens` (linha 61), após as linhas de PostHog mas antes do `rescue`, adicionar:

```ruby
WelcomeEmailJob.perform_later(user.id) if user.previously_new_record?
```

O método `previously_new_record?` está disponível no ActiveRecord desde Rails 6 — retorna `true` se o registro foi criado na request atual (vs. encontrado).

A verificação de `welcome_email_sent_at` já existe no job, então chamadas duplicadas são seguras.
  </action>
  <verify>
    <automated>cd /c/Users/Bobi/Desktop/AB0-1-main/AB0-1-back && grep -n "welcome" app/mailers/user_mailer.rb && grep -n "update_column" app/jobs/welcome_email_job.rb && grep -n "WelcomeEmailJob" app/controllers/users/omniauth_callbacks_controller.rb</automated>
  </verify>
  <done>
    - UserMailer.welcome(user) existe em user_mailer.rb com @user, @frontend_url, @login_url
    - WelcomeEmailJob.perform_later faz update_column(:welcome_email_sent_at) após deliver_later
    - omniauth_callbacks_controller chama WelcomeEmailJob.perform_later(user.id) quando previously_new_record?
    - Chamadas duplicadas são idempotentes (job verifica welcome_email_sent_at antes de enviar)
  </done>
</task>

<task type="auto">
  <name>Task 3: Analytics pageTracking + filter_applied events em /companies</name>
  <files>
    AB0-1-front/app/companies/CompaniesPageClient.tsx
  </files>
  <action>
**Em CompaniesPageClient.tsx — função `CompaniesContent`:**

**1. Adicionar imports no topo do arquivo:**

```typescript
import { usePageTracking } from '@/hooks/usePageTracking';
import { track } from '@/lib/analytics/consolidated';
```

**2. Adicionar `usePageTracking` no início de `CompaniesContent` (após linha 40, antes dos useState):**

```typescript
usePageTracking({
  type: 'listing',
  title: 'Empresas de Energia Solar - Avalia Solar',
});
```

**3. Adicionar useEffect para tracking de filtros após o useEffect de fetchData (após linha 170):**

```typescript
// Track filter changes
useEffect(() => {
  // Não disparar no mount inicial (loading=true ou sem companies ainda)
  if (loading) return;

  const activeFilters: Array<{ filter_key: string; filter_value: any }> = [];

  if (requestParams.q) activeFilters.push({ filter_key: 'search', filter_value: requestParams.q });
  if (requestParams.state) activeFilters.push({ filter_key: 'state', filter_value: requestParams.state });
  if (requestParams.city) activeFilters.push({ filter_key: 'city', filter_value: requestParams.city });
  if (requestParams.category_ids) activeFilters.push({ filter_key: 'category_ids', filter_value: requestParams.category_ids });
  if (requestParams.min_rating) activeFilters.push({ filter_key: 'min_rating', filter_value: requestParams.min_rating });
  if (requestParams.verified) activeFilters.push({ filter_key: 'verified', filter_value: requestParams.verified });
  if (requestParams.featured) activeFilters.push({ filter_key: 'featured', filter_value: requestParams.featured });
  if (requestParams.sort) activeFilters.push({ filter_key: 'sort', filter_value: requestParams.sort });

  if (activeFilters.length > 0) {
    activeFilters.forEach(({ filter_key, filter_value }) => {
      track('filter_applied', { filter_key, filter_value, page: 'companies' });
    });
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [requestParams]);
```

Nota: `track` vem de `@/lib/analytics/consolidated` — já está exportado via `lazy.ts`. Assinatura: `track(event: string, properties?: Record<string, any>)`.
  </action>
  <verify>
    <automated>cd /c/Users/Bobi/Desktop/AB0-1-main/AB0-1-front && grep -n "usePageTracking\|filter_applied\|track(" app/companies/CompaniesPageClient.tsx</automated>
  </verify>
  <done>
    - CompaniesPageClient importa usePageTracking e track
    - usePageTracking({ type: 'listing', title: 'Empresas...' }) chamado no início de CompaniesContent
    - useEffect com deps [requestParams] dispara track('filter_applied', { filter_key, filter_value, page: 'companies' }) para cada filtro ativo
    - Não dispara durante loading para evitar eventos espúrios no mount
  </done>
</task>

</tasks>

<verification>
- curl http://localhost:3001/api/v1/products?q=painel&sort=price_asc&page=1&per_page=5 → retorna { data: [...], meta: { total, page, per_page, total_pages } }
- curl http://localhost:3001/api/v1/products → ainda funciona sem params (paginação com defaults)
- UserMailer.welcome(User.first).deliver_now no Rails console → sem erros
- Abrir /companies no browser, aplicar filtro state → GTM DataLayer deve conter filter_applied event
- TypeScript: cd AB0-1-front && npx tsc --noEmit (sem erros novos em api-client.ts, useProducts.ts, CompaniesPageClient.tsx)
</verification>

<success_criteria>
- Backend products index suporta q, category_id, sort, page, per_page e retorna meta paginado
- WelcomeEmailJob é disparado após OAuth de novo usuário e não duplica envios
- /companies rastreia page views e filter_applied events no GTM
- Nenhum breaking change nos endpoints ou componentes existentes
</success_criteria>

<output>
Após conclusão, registrar mudanças neste arquivo quick plan ou criar summary em `.planning/quick/260409-czz-ci-github-actions-testes-basicos-filtros/260409-czz-SUMMARY.md`.
</output>
