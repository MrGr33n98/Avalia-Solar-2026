# Story: Reestruturação da Plataforma de Banners - Fase 1 (Patch 1.2)

## Contexto
A plataforma de banners sofria com inconsistências entre o que o ActiveAdmin permitia gerenciar e o que o frontend consumia, além de uma governança fraca sobre o status de exibição.

## O que foi corrigido (Patch 1.0, 1.1 e 1.2)

### Backend & Admin
- **Unificação de Posições:** Habilitada a posição `companies_footer` no backend, alinhando com o frontend.
- **Novo Placement Blog:** Criada a posição `article_footer_cta` dedicada para banners no rodapé de artigos, evitando conflito com o inventário de categorias.
- **Gestão de Slot Key:** Campo `slot_key` agora é editável no ActiveAdmin, permitindo injeção técnica de banners em locais específicos sem depender de Dev.
- **Status Operacional Unificado:** Implementada lógica visual no `index` e `show` do ActiveAdmin para distinguir banners:
  - `Ativo Agora` (Aprovado + Dentro da janela de data + Ativo)
  - `Agendado` (Aprovado + Data futura)
  - `Expirado` (Aprovado + Data passada)
  - `Draft` / `Submitted` / `Rejected` (Estados de moderação)
  - `Inativo` (Flag manual de desativação)
- **Melhoria de UX:** Formulário do Admin organizado em Tabs (Geral, Targeting, Agendamento).
- **Correção de Prioridade:** Hint corrigido para refletir que valores menores (1, 2...) aparecem primeiro.

### Frontend
- **Fallback de Imagem:** Corrigido o caminho do placeholder para `/images/banner-placeholder.svg` (evita 404).
- **Suporte a Hydration:** Hook `useBannersQuery` agora aceita `initialData`, permitindo que a Home renderize banners via SSR sem flashes de conteúdo.
- **Flexibilidade de Props:** `BannerByLocation` agora suporta `slotKey`, `categoryId` e `companyId` como filtros.
- **Aspect Ratio Dinâmico:** `BannerContainer` agora ajusta o formato automaticamente baseado na posição (`navbar` 10:1, `sidebar` 1:1, `categories_top` 12:1).
- **Correção de Links:** Corrigido link quebrado em `CategoryHighlights` do blog para apontar para o slug real de financiamento.

## Gaps Identificados (Para Fase 2)
- **Cache Server-Side da Home:** A Home utiliza `unstable_cache` do Next.js com `revalidate: 600` (10 minutos). Mudanças no Admin não refletem instantaneamente no servidor.
- **Solução Futura:** Implementar On-demand Revalidation (Purge via Webhook) no Patch 2.
- **Migração BannerGlobal:** O modelo `BannerGlobal` continua existindo para o Blog, mas deve ser absorvido pelo modelo `Banner` unificado na próxima fase.

## Validação Técnica
- `ruby -c` em Model e Admin: **OK**
- `npm run lint` em componentes alterados: **OK**
- Typecheck em `app/page.tsx` e hooks: **OK**
