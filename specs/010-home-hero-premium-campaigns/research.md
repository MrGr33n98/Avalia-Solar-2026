# Pesquisa Técnica, Decisões e Padrões de Mercado

**Feature:** `010-home-hero-premium-campaigns`  
**Data:** 16 de Outubro de 2026

---

## 1. Padrões de Mercado e Referências Oficiais

- **IAB New Ad Portfolio (Flexible Ad Units):**
  - Diretrizes para inventário responsivo e não-intrusivo em marketplaces e plataformas de conteúdo.
  - Princípio de separação estrita entre conteúdo editorial e peças patrocinadas.
  - Ref: [IAB Tech Lab New Ad Portfolio](https://iabtechlab.com/standards/iab-new-ad-portfolio-guidelines/)
- **Next.js Image Optimization (App Router):**
  - O componente `next/image` aplica redimensionamento e conversão de formato (`image/avif`, `image/webp`).
  - Imagens de alta prioridade (LCP) devem receber a propriedade `priority` (injetando `fetchPriority="high"`).
  - Um asset fonte de baixa resolução (ex: 480px) não ganha resolução ao ser re-encodado pelo Next.js com `quality=100`; o segredo da nitidez está na qualidade do asset de origem entregue pelo backend.
  - Ref: [Next.js Image Component Documentation](https://nextjs.org/docs/app/api-reference/components/image)
- **Rails Active Storage Image Variants:**
  - `image.variant(resize_to_limit: [width, height])` preserva a proporção sem cortar, reduzindo a dimensão limitante.
  - Se um asset de proporção 3:1 é submetido a `resize_to_limit: [1200, 160]`, a restrição de altura 160 força a largura para 480px.
  - Para o slot `home_hero`, as dimensões canônicas exigem `resize_to_limit: [1920, 600]`, garantindo que imagens 16:9, 3:1 ou 4:1 preservem densidade suficiente para telas 2x/Retina.
  - Ref: [Ruby on Rails Active Storage Overview](https://guides.rubyonrails.org/active_storage_overview.html)
- **Google Web Vitals — LCP Optimization:**
  - O elemento do hero da home é o candidato mais frequente a Largest Contentful Paint (LCP).
  - Meta de LCP <= 2,5s no percentil 75.
  - Ref: [web.dev — Optimize LCP](https://web.dev/articles/optimize-lcp)

---

## 2. Decisões Arquiteturais e Alternativas Rejeitadas

| Decisão Adotada | Alternativa Rejeitada | Racional da Rejeição |
|---|---|---|
| **Evolução aditiva do modelo `Banner` existente.** | Criar um modelo e subsistema separado (ex: `HeroCampaign`). | Duplicaria infraestrutura de assinaturas, targeting, upload S3/Spaces, moderação e faturamento. |
| **Criação do slot `home_hero` no catálogo.** | Alterar as dimensões do slot legado `home_top` para 1920×420. | Quebraria contratos comerciais e layouts legados em outros pontos do sistema onde 1200×160 é esperado. |
| **Dois modos de criativo: `photo_with_html` e `image_only`.** | Forçar sempre overlay HTML com título e botão. | Anunciantes frequentemente fornecem artes já diagramadas; forçar overlay HTML sobre arte pronta gerava texto duplicado e visual ilegível. |
| **`<picture>` com `<source media="...">` para art direction.** | Cortar dinamicamente a imagem desktop no mobile via CSS `object-fit: cover`. | Corta elementos cruciais da imagem em telas estreitas de smartphones (PWA). |
| **Invalidação granular com webhook assinado (`revalidateTag`).** | `Rails.cache.clear` global ou esperar TTL de 24h expirar. | Limpar o cache global derruba o desempenho do banco; esperar 24h inviabiliza publicações em tempo hábil. |
