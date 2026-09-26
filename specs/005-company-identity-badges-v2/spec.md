# Spec 005 — Company Identity, Commercial Plan, Trust & Badges Architecture V2

## 1. Visão Geral & Separação de Conceitos

Separação definitiva e estrita dos seguintes 8 conceitos de domínio no monorepo Avalia Solar:
1. **Categoria da Empresa (`identity.primary_category`)**: Vertical principal de atuação (ex: "Mobilidade Elétrica").
2. **Empresa Verificada (`identity.verification`)**: Status oficial de validação jurídica e cadastral.
3. **Plano Comercial (`commercial_status`)**: Assinatura e tier comercial (`free`, `pro`, `enterprise`).
4. **Destaque (`distribution.featured`)**: Destaque editorial na plataforma.
5. **Patrocinado (`distribution.sponsored`)**: Posicionamento patrocinado comercialmente pago.
6. **Badge / Reconhecimento (`recognitions`)**: Medalhas e selos técnicos outorgados (ex: "Top Brand 2026").
7. **Ranking / Vencedor (`ranking`)**: Resultados oficiais de premiações publicadas.
8. **TrustScore (`trust.trust_score`)**: Pontuação algorítmica de credibilidade e segurança.

Regra Fundamental: **Backend decide a semântica. Frontend apenas apresenta.**
Proibido inferir domínio no frontend (`featured || has_paid_plan`, `categories[0]`, `priority_score >= 100`).

---

## 2. DTO Canônico Alvo (REST & GraphQL)

```json
{
  "id": 10,
  "name": "WEG Solar",
  "slug": "weg-solar",
  "identity": {
    "primary_category": {
      "id": 70,
      "name": "Mobilidade Elétrica",
      "slug": "mobilidade-eletrica"
    },
    "verification": {
      "status": "verified",
      "verified": true,
      "verified_at": "2026-01-15T10:00:00Z",
      "method": "receita_federal_and_manual_audit"
    }
  },
  "commercial_status": {
    "tier": "pro",
    "status": "active",
    "paid": true
  },
  "distribution": {
    "featured": false,
    "sponsored": false
  },
  "recognitions": [
    {
      "id": 12,
      "name": "Top Brand 2026",
      "description": "Líder nacional em inversores e infraestrutura solar.",
      "category": "Mobilidade Elétrica",
      "year": 2026,
      "edition": "1",
      "public_slug": "top-brand-2026-a1b2",
      "image_url": "https://avaliasolar.com.br/rails/active_storage/blobs/proxy/.../badge.png",
      "verification_url": "https://avaliasolar.com.br/badges/top-brand-2026-a1b2"
    }
  ],
  "trust": {
    "trust_score": 87.5,
    "is_claimed": true,
    "verification_status": "verified"
  }
}
```

---

## 3. Governança da Categoria Primária (`primary_category`)
1. **Origem:** Coluna persistida `companies.primary_category_id` (FK para `categories`).
2. **Edição:** Empresa escolhe via Dashboard / onboarding; Admin pode sobrescrever no ActiveAdmin.
3. **Validação:** A `primary_category_id` DEVE obrigatoriamente pertencer ao conjunto de `categories` da empresa.
4. **Legado:** Empresas com apenas 1 categoria recebem backfill determinístico para essa categoria. Empresas com múltiplas ou nenhuma categoria permanecem com `primary_category_id = NULL` até escolha auditada.
5. **UI no Perfil:** Renderizado no hero como badge clicável apontando para `/categories/{slug}` com acessibilidade total.

---

## 4. Governança de Verificação (`verification`)
1. **Independência Total:**
   - `VERIFIED != PAID` (Empresa Free pode ser verificada).
   - `PAID != VERIFIED` (Empresa Pro/Enterprise sem auditoria é `unverified`).
   - `FEATURED != VERIFIED` (Destaque não concede verificação).
   - `BADGE != VERIFIED` (Receber um prêmio não verifica automaticamente o CNPJ).
2. **Contrato:** Bloco `verification: { status, verified, verified_at, method }`.

---

## 5. Governança Comercial (`commercial_status`)
1. **Tiers Reais:**
   - `free` ➔ Nenhum badge comercial exibido.
   - `pro` ➔ Exibe badge discreto `PRO`.
   - `enterprise` ➔ Exibe badge discreto `ENTERPRISE`.
2. **Proibição:** Eliminar o uso do termo genérico "PREMIUM" no lugar de planos reais. `featured` nunca mais aciona badge comercial.

---

## 6. Governança de Badges & Reconhecimentos (`recognitions`)
1. **Entidades:** Reutilizar `Badge`, `CompanyBadge` e ActiveStorage `Badge#image`.
2. **Contrato Canônico Único:** `id`, `name`, `description`, `category`, `year`, `edition`, `public_slug`, `image_url`, `verification_url`.
3. **Eliminar Fallbacks:** Fim da cadeia `image_url || url || image || icon_url`.
4. **Correção de `certification_progress`:** Usar `image_url` e `category_label`, sem chamar atributos fantasmas nem silenciar erros.
5. **Rota Pública SSR:** `app/badges/[slug]/page.tsx` no Next.js App Router, com OpenGraph, JSON-LD e 404 real para selos inexistentes.
6. **Badge na Logo:** No máximo UM badge determinístico no canto superior da logo (`badge.position`), sem encobrir a marca.
7. **WinnerBadge:** Desacoplado de `priority_score >= 100`; ativado apenas por reconhecimento/premiação oficial emitida.
