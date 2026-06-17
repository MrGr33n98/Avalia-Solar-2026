# SEO COMPATIBILITY SPEC — Otimização de Busca e Semântica

Este documento especifica a engenharia de SEO necessária para a refatoração do perfil, assegurando que o portal mantenha e expanda seu posicionamento orgânico de ponta no Google.

---

## 1. Metadados do Servidor (Server-Side Metadata)

A rota `app/companies/[id]/page.tsx` continuará operando como um Server Component Next.js, injetando dados estáticos na renderização do cabeçalho HTML:

- **Metadados Principais:**
  - `title`: `[Nome da Empresa] - Energia Solar e Mobilidade Elétrica | Avalia Solar`
  - `description`: `Confira as avaliações, projetos realizados, produtos e contatos da empresa [Nome da Empresa] localizada em [Cidade] - [Estado] no portal Avalia Solar.`
- **OpenGraph & Twitter Cards:**
  - `og:title`, `og:description`, `og:image` (aponta para a URL do logo ou banner da empresa no S3).

---

## 2. Marcação Semântica e Hierarquia de Cabeçalhos

Garantiremos que cada aba consumida use a estrutura semântica HTML5 recomendada:

- **Hierarquia Estrita de Headings:**
  - Uma única tag `<h1>` na página, renderizada no Header unificado para o nome da empresa:
    ```html
    <h1 className="text-slate-950 font-black text-2xl md:text-3xl">
      {company.name}
    </h1>
    ```
  - Tags `<h2>` para os títulos de cada aba ou subseção principal (ex. `<h2>Avaliações e Depoimentos</h2>`).
  - Tags `<h3>` para elementos internos de menor escala (ex. títulos de reviews individuais ou especificações de produtos).

---

## 3. Dados Estruturados JSON-LD (Schema.org)

Injetaremos o seguinte script de marcação estruturada JSON-LD na página para permitir que o Google exiba rich snippets em formato de estrelas na pesquisa orgânica:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{company.name}",
  "url": "https://www.avaliasolar.com.br/companies/{company.slug}",
  "logo": "{logoUrl}",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "{company.city}",
    "addressRegion": "{company.state}",
    "streetAddress": "{company.address}"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{company.rating_avg > 0 ? company.rating_avg : 5.0}",
    "reviewCount": "{company.rating_count > 0 ? company.rating_count : 1}",
    "bestRating": "5",
    "worstRating": "1"
  }
}
</script>
```
