# Context7 – Guia de Uso

## Objetivo
Gerenciar estado global por domínio com interfaces simples e previsíveis.

## Implementação
- Provider: `AB0-1-front/app/context7/provider.tsx`
- Hook: `useGalleryContext7` com `gallery` e `dispatchGallery`.

## Padrão de Actions
- `set_photos`, `set_videos`, `loading`.

## Integração com API
- Ler fotos: `GET /api/v1/company_dashboard/media`.
- Ler vídeos: `GET /api/v1/company_dashboard/videos`.
- Adicionar vídeo: `POST /api/v1/company_dashboard/add_video`.
- Remover vídeo: `DELETE /api/v1/company_dashboard/remove_video`.

## Diagrama
```
React View -> dispatch -> Context7 Store -> re-render
                     \
                      -> fetch API -> atualizar store
```

