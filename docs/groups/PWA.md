# Groups PWA

Status: planejamento; nenhuma rota Groups habilitada.

## Navegação

Não ampliar bottom navigation existente. Groups entra em Menu ou destino de baixa frequência, após decisão de UX e testes. Navegação atual não deve ser substituída sem evidência.

## Layout

- app bar compacto;
- abas touch-friendly;
- cards sem overflow horizontal;
- detail com back, identidade, membership, tabs e feed;
- composer fullscreen/modal keyboard-safe;
- `100dvh` e `env(safe-area-inset-bottom)` quando aplicável.

## Rollout

1. backend e API testados;
2. rota web atrás de `GROUPS_ENABLED=false`;
3. PWA somente com dados reais e error/loading states;
4. teste nas larguras 320, 360, 375, 390 e 414;
5. staging e E2E antes de habilitar produção.
