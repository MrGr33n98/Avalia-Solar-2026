# Quickstart de homologação
1. Setup em worktree conforme setup.md. Copiar pack para specs/022-dashboard-tremor-a-plus; validar numeração.
2. Rodar preflight, inventário e baseline no checkout. Capturar fixtures, snapshots e API parity.
3. Subir ambiente local conforme README do repo e usar tenant sintético A/B, papéis e planos reais de teste.
4. Executar primeira história US01 com teste RED e correção mínima se reproduzida. Implementar flags e tokens escopados somente após baseline.
5. Rodar testes unitários, e2e, a11y, regressão visual e build. Preencher acceptance e evidências; abrir PR draft.
6. Staging via pipeline existente, sem ativação produtiva. Validar rollback. Não marcar MVP concluído até W0–W7 aprovadas.
