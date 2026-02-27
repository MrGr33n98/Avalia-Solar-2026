# STORY-2026-02-27: Corrigir crash em runtime na página de categorias

## Contexto
As páginas de categoria em produção passaram a falhar no frontend com `ReferenceError: ChevronRight is not defined`, impedindo a renderização correta do filtro lateral.

## Requisito
Garantir que a rota `/categories/[slug]` renderize sem erro em runtime, com os ícones usados no sidebar devidamente importados.

## Acceptance Criteria
- [x] `CategoryFilterSidebar` importa todos os ícones que renderiza.
- [x] A página `/categories/[slug]` não quebra por `ReferenceError` ligado a `ChevronRight` ou `Zap`.
- [x] As validações relevantes foram executadas e qualquer bloqueio remanescente foi documentado.

## Checklist de Implementação
- [x] Corrigir imports de `lucide-react` em `components/categories/CategoryFilterSidebar.tsx`.
- [x] Rodar `npm run lint` no frontend.
- [ ] Rodar `npm run build` no frontend.

## File List
- [x] `components/categories/CategoryFilterSidebar.tsx`
- [x] `docs/stories/STORY-2026-02-27-category-page-runtime-fix.md`

## Validation
- [x] `npm run lint` em `AB0-1-front`
- [ ] `npm run build` em `AB0-1-front` (bloqueado por `JavaScript heap out of memory` no build do Next, sem relação direta com o import corrigido)
