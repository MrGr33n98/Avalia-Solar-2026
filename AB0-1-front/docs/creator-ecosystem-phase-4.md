# Creator Ecosystem — Fase 4

## Escopo

Templates sociais reutilizáveis e preview branded no Share Center. Geração server-side de assets não foi incluída; componentes foram isolados para permitir essa evolução sem reescrever o contrato.

## Componentes criados

- `components/social-templates/SocialCardBase.tsx`
- `components/social-templates/InstagramFeedTemplate.tsx`
- `components/social-templates/InstagramStoryTemplate.tsx`
- `components/social-templates/LinkedInTemplate.tsx`
- `components/social-templates/XTemplate.tsx`
- `components/social-templates/OpenGraphTemplate.tsx`
- `components/share/SocialFormatSelector.tsx`

## Formatos

- Instagram Feed: `1080 × 1350`
- Instagram Story: `1080 × 1920`
- LinkedIn: `1200 × 627`
- X: `1600 × 900`
- Open Graph: `1200 × 630`

## Integração

`ShareModal` agora permite selecionar formato e exibe preview branded para formatos visuais. Todos os templates recebem o mesmo `ShareResource`, sem duplicar dados de publicação ou creator.

## Decisões

- Templates não usam `html2canvas`.
- Preview é determinístico e reutilizável.
- Instagram continua sem promessa de publicação automática.
- Geração de PNG persistente fica preparada para endpoint futuro de `share_assets`.
- `OpenGraphTemplate` pode ser usado futuramente por route handler de imagem dinâmica.

## Metadata

Post público já possui metadata `article`, URL canônica, `publishedTime`, `modifiedTime`, author e cover image. Fase 4 adicionou URL Open Graph explícita.

## Validação

- `npm run typecheck`: passou.
- Templates sociais: 4 testes passaram.
- ShareModal: 1 teste passou.
- `git diff --check`: passou.

## Pendências

- Endpoint server-side para geração/cache de assets.
- Download de PNG no navegador.
- Teste visual dos formatos.
- Fase 5: share events persistentes e attribution server-side.
