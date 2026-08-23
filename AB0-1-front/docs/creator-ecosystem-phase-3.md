# Creator Ecosystem — Fase 3

## Escopo

Criar Share Center universal para publicação, creator profile, post page, feed e Tree.

## Componentes

- `components/share/ShareModal.tsx`
- `components/share/SharePreview.tsx`
- `components/share/SharePlatformGrid.tsx`
- `lib/share/shareTypes.ts`
- `lib/share/shareTargets.ts`
- `lib/share/buildShareUrl.ts`
- `lib/share/shareAnalytics.ts`

## Recursos

- Contrato único `ShareResource`.
- Plataformas:
  - Instagram
  - WhatsApp
  - LinkedIn
  - X
  - Facebook
  - Copiar link
  - Mais opções
- Web Share API quando disponível.
- Fallback por URL de plataforma ou clipboard.
- Instagram não promete publicação automática; copia link e abre Instagram.
- URLs externas recebem UTM:
  - `utm_source`
  - `utm_medium=social`
  - `utm_campaign=creator_share`
  - `utm_content`
- Preview com título, descrição, imagem e URL canônica.
- Evento `creator_share_clicked` adicionado ao schema analytics.

## Integrações

- Feed: `PublicationFeedCard`.
- Creator profile: `CreatorShareButton`.
- Post page: compartilhamento de publicação.
- Creator Studio: compartilhamento de publicação.
- Tree público: compartilhamento do Tree.

## Decisões

- Nenhum modal de share duplicado foi criado.
- Geração de asset visual server-side fica para Fase 4.
- Nenhuma publicação automática em Instagram foi simulada.
- `native_share` usa clipboard como fallback.
- Eventos atuais usam camada frontend de analytics; backend `share_events` fica para Fase 5.

## Validação

- `npm run typecheck`: passou.
- `ShareModal.test.tsx`: passou.
- Tree público: 2 testes passaram anteriormente.
- `git diff --check`: passou.

## Pendências

- Adicionar teste para todos os builders de URL.
- Backend estruturado para `share_events` na Fase 5.
- Social Template Engine e assets na Fase 4.
- Ajustar visual de mobile com Sheet dedicado se necessário.
