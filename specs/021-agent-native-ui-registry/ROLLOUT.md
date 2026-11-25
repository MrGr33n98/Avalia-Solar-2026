# Rollout
1. W0 base e flags existentes; não ativar novas superfícies por padrão.
2. Dev e CI: unit/typecheck/build/e2e/Rails/registry; artefatos de teste sem dados pessoais. Verificar manifest e gzip.
3. Draft PR com diffs por wave e links reais. Revisão humana de UI, segurança, dados e licença. Sem merge automático.
4. Staging via pipeline MCP existente, se autorizado. Validar flags, recursos e OAuth, smoke de hosts, fallback textual e rollback drill. Usar dados sintéticos ou devidamente autorizados.
5. Canary com flags e clientes permitidos; medir erros de tool, render e latência versus baseline; qualquer regressão crítica ou violação de segurança reverte imediatamente. Não ativar se gate falhou.
6. Produção só com aprovação explícita e CI verde, janela e operador definidos. Preservar artefato anterior e registrar flags e SHA; não habilitar todas as superfícies de uma vez.

Nenhum deploy faz parte da geração deste pack. W8+ requer autorização adicional. Janela de observação sugerida 24h em canary, ajustar a volume e métricas reais; não inventar resultados.
