# PRD/PDRM — Widgets de Reputação (Marketing Assets) — V1

**Produto:** Avalia Solar. **Data:** 05/11/2026. **Status:** implementação inicial em branch para QA, sem deploy.
**Rota:** `/dashboard?company_id={id}&tab=marketing-widgets` (Reputação > Widgets de Reputação).

## Objetivo
Criar um catálogo premium e mobile-first de quatro modelos inspirados no G2, com a identidade IBM/Carbon do Avalia Solar e reutilização da infraestrutura de avaliações, ranking e permissões:
1. **Ranking Avalia Solar:** posicionamento oficial (somente se a API confirmar posição + população e não retornar prévia/bloqueio);
2. **Resumo de Avaliações:** nota e total de avaliações aprovadas, sem métricas falsas;
3. **Widget de Estrelas:** três apresentações compactas da nota existente;
4. **Widget de Depoimentos:** somente avaliações aprovadas **e destacadas**, quando a empresa tiver permissão e prova social habilitada.

## Descoberta e infraestrutura
- `company_dashboard/social_proof_stats` contém `approved_reviews` e `average_rating`.
- `company_dashboard/social_proof_reviews` traz `featured`, `status`, nome público e permissões `can_feature_reviews` / `social_proof_enabled`.
- `company_dashboard/analytics/ranking` fornece posição oficial sob gate de entitlement `advanced_analytics` (não contornar bloqueios).
- O Content Studio / Trust Widget existente é preservado; a nova página é uma aba independente.
- A PoC do briefing continha números demonstrativos como **4,8** e **128 avaliações**, retrato fictício e quadrantes inventados. A interface real não os publica.

## Entrega V1
- Quatro cartões, preview responsivo, seletor, temas claro/escuro, resumo de regras, estado de carregamento/erro/sem dados.
- Personalização na própria página; CTA de copiar **HTML estático** quando houver métricas e permissões.
- Link rastreável ao perfil público com `utm_source=marketing_widget`, `utm_medium=embed` e campanha por widget.
- Escape contextual de nome, autor e depoimento; sem scripts, CSS remoto, eventos `onerror`, `dangerouslySetInnerHTML` ou importação de avatares externos.
- Analytics de `reputation_marketing_widget_selected` e `reputation_marketing_widget_snapshot_copied`, sem e-mails de clientes ou conteúdo de avaliações nos eventos.
- Sem monetização/venda de leads.

### Limites explicitamente assumidos
A V1 **não promete dados em tempo real na página externa**. O código HTML copiado é um snapshot: o gestor deve atualizá-lo após mudança de avaliação/nota/ranking. A prévia do Ranking não simula coordenadas do quadrante. O HTML não deve ser chamado de selo oficial nem de certificado de confiança.

A distribuição dinâmica por `embed.js` com Shadow DOM ainda **não** existe nesta nova versão. A PoC enviada é referência visual, não um renderizador de produção.

## Requisitos P0 e critérios de aceite
| ID | Requisito | Aceite |
|---|---|---|
| W-01 | Rota/IA em Reputação | Novo menu sem romper `trust-widget` ou `avalia-badges` |
| W-02 | Catálogo 4 modelos | Cards em 1/2/4 colunas, 320px sem rolagem horizontal |
| W-03 | Fonte canônica | Sem nota fictícia quando API não retorna avaliações |
| W-04 | Ranking | Sem código se resposta `locked`, `preview`, `error` ou posição inconclusiva |
| W-05 | Depoimentos | Apenas `approved + featured`, permissão e prova social ativos |
| W-06 | Segurança | HTML exportado com caracteres especiais escapados e links codificados |
| W-07 | Exportação | Somente HTML estático; texto de atualização manual visível |
| W-08 | Reatividade | Troca de empresa esvazia contagens e snapshots anteriores |
| W-09 | A11y | Controles >=44px, botões com labels, foco visível, contraste |
| W-10 | QA | Jest, typecheck, build, E2E com Free/Pro e empresa sem reviews |

## User stories
- **US01:** Como empresa sem reviews, quero ver quatro formatos e saber por que não posso publicar uma nota inexistente.
- **US02:** Como gestor com reviews aprovadas, quero escolher modelo e tema e copiar um HTML auditável.
- **US03:** Como empresa sem acesso a ranking Pro, não devo ver posição inventada nem gerar código do ranking.
- **US04:** Como gestor com permissão de prova social, quero publicar apenas depoimento autorizado e destacado.
- **US05:** Como usuário no PWA, quero navegar pelos cartões sem cards enormes e com ações tocáveis.
- **US06:** Como operador multi-tenant, quero que a troca `company_id` impeça vazamento visual de dados da empresa anterior.

## Roadmap — build enterprise de widgets dinâmicos
P1: `/api/v1/public_widgets/:token` versionado, com tokens públicos opacos de escopo limitado; `widget_configs` por empresa/tipo; autenticação no dashboard, domínio autorizado e revogação; validação e sanitização no Rails; aplicação de entitlement server-side; somente reviews aprovadas e compartilháveis.

P2: script `embed.js` <15 KB comprimidos com Custom Element/Shadow DOM, CSP e `textContent` para strings dinâmicas; cache com TTL curto e invalidação na moderação; suporte a tema, lang e skeletons; teste de integração em sites externos.

P3: telemetria de impressões reais, cliques, referrers normalizados e experimentos por tipo; rate limiting, monitoramento PostHog, retentativa e rollout gradual por feature flag.

**Não contornar gates:** toda publicação deve continuar subordinada às permissões reais de prova social/ranking. Monetizar capacidades de personalização e analytics onde houver entitlement, nunca o resultado da nota ou a posição no ranking.

## QA antes de release
```sh
cd AB0-1-front
npm test -- --runInBand lib/marketing-widgets/snapshot.spec.ts app/dashboard/components/marketing-widgets/ReputationMarketingWidgets.spec.tsx
npm run typecheck
npm run build
```
Revisar com empresa 0 reviews, 12 reviews, ranking locked/preview/ready, depoimento aprovado e destacado, prova social bloqueada, rede indisponível, troca multiempresa, HTML contendo `<script>`, tema dark/light, 320/360/390/430/768/1440px.
