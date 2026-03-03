# Story: Corrigir hooks faltantes no prerender do frontend

## Contexto
O deploy do frontend falhou durante o prerender estatico do Next.js com `ReferenceError: useRef is not defined`.

A falha vinha do componente cliente compartilhado `components/ClientBody.tsx`, que utilizava `useRef`, `useEffect` e `useCallback` sem importar os hooks de `react`.

## O que foi ajustado
- adicionado import explicito de `useCallback`, `useEffect` e `useRef` em `components/ClientBody.tsx`
- mantido o comportamento do componente sem alteracoes funcionais alem da correcao de runtime

## Arquivos alterados
- `components/ClientBody.tsx`
- `docs/stories/STORY-2026-03-03-frontend-prerender-hooks-fix.md`

## Checklist
- [x] Identificar o arquivo que quebrava o prerender
- [x] Corrigir imports de hooks ausentes
- [ ] Rodar `npm run lint`
- [ ] Rodar `npm run typecheck`
- [ ] Rodar `npm test`
- [ ] Rodar `npm run build`

## Validacao
- `npm run lint` nao executou neste ambiente porque `next` nao esta disponivel sem dependencias instaladas
- `npm run typecheck` nao existe neste `package.json`
- `npm test` nao executou neste ambiente porque `cross-env` nao esta disponivel sem dependencias instaladas
- `npm run build` nao executou neste ambiente porque `next` nao esta disponivel sem dependencias instaladas

## File List
- `components/ClientBody.tsx`
- `docs/stories/STORY-2026-03-03-frontend-prerender-hooks-fix.md`
