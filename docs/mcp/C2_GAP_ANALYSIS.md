# C2 — GAP Analysis baseada em evidências

| Item | Estado | Evidência/ação |
|---|---|---|
| Doorkeeper + Devise | Resolvido | Rotas e specs C1 preservados; sessão Devise segue o autenticador do Doorkeeper. |
| PKCE S256 | Resolvido | Configuração C1 e spec de Authorization Code. |
| `resource` no grant/token | Resolvido | Migration `20261117210000`, controllers e spec C2. |
| Token opaco hashado | Resolvido | `by_token`, `accessible?`, expiração e revogação do Doorkeeper. |
| Scope único | Resolvido | `mcp:public:read`; documentação C1 corrigida. |
| Issuer/resource discovery | Resolvido em código | Endpoints testados localmente; HTTPS real ainda não homologado. |
| JWT RFC 9068/JWKS | Não aplicável ao desenho C2 | Não emitir JWT paralelo; necessário novo ADR se o produto exigir JWT. |
| Staging isolado, DNS e TLS | P0 pendente | Nenhum ambiente externo foi acessado nesta PR. |
| Clientes MCP independentes | P0 pendente | Não declarar compatibilidade sem execução real. |
| ChatGPT/Claude | P1 pendente | Credenciais, callbacks e plano compatível não disponíveis/verificados. |
| MCP privado multiempresa | C3 | Fora desta branch. |
| Produção | NO-GO | Flags e rollout não foram ativados. |
