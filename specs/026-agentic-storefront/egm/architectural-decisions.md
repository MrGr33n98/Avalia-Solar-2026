# Decisões Arquiteturais Registradas: SPEC 026 — Agentic Storefront

**Status:** Decisões Homologadas pelo Tech Lead  
**Governança:** Elephant-Goldfish Model (EGM)  
**Data:** 26 de Novembro de 2026  

---

## ADR-026-001: Modelagem do Storefront em Rails 7 com Service Objects
- **Contexto:** Necessidade de prover vitrine B2B/B2C sem acoplar regras de negócio em controllers ou inflar desnecessariamente o model central `Company`.
- **Decisão:** Implementar `Storefront::PublicProfileService` como PORO (Plain Old Ruby Object), com autorização via Pundit e serialização via ActiveModelSerializers.
- **Consequências:** Manutenção da simplicidade 37signals Rails, testes unitários ultrarrápidos e facilidade de cache HTTP/Redis.

## ADR-026-002: Exposição Agent-Native via MCP e MCP Apps SDK
- **Contexto:** A vitrine do integrador deve ser consumível por agentes de IA (ChatGPT, Claude, Cursor) com interface visual rica.
- **Decisão:** Registrar a ferramenta pública `show_storefront_profile` em `Mcp::PublicToolRegistry` e compilar a superfície standalone `ui://avalia-solar/storefront/v1.html` dentro do budget estrito de $\le 120\text{ KiB}$ gzip.
- **Consequências:** Experiência agentic de ponta a ponta sem violação de CSP.

## ADR-026-003: Isolamento Multi-Tenant e Prevenção Rigorosa de IDOR
- **Contexto:** Apontamento crítico [F-07-01] identificou risco de alteração indevida de storefronts de outras empresas no dashboard B2B.
- **Decisão:** O controller de gestão `app/controllers/app/storefronts_controller.rb` deve resolver a empresa exclusivamente através do escopo do usuário autenticado (`current_user.companies.find(...)`), combinada com a policy `StorefrontPolicy`.
- **Consequências:** 100% de blindagem contra ataques de IDOR e vazamento entre tenants.

## ADR-026-004: Eager Loading Obrigatório e Proteção Anti-N+1
- **Contexto:** A montagem do Storefront consolida `Company`, `StorefrontSetting`, `CompanyProject` e `CompanyProduct`.
- **Decisão:** O service object deve executar carregamento explícito via `includes` de todas as associações filhas, com verificação automatizada pelo `Bullet` em testes e desenvolvimento.
- **Consequências:** Latência p95 mantida abaixo de 100ms mesmo em empresas com dezenas de projetos cadastrados.

## ADR-026-005: Singlefile Autocontido para CSP no MCP Apps SDK
- **Contexto:** Hosts de IA impõem CSPs restritivas que bloqueiam o carregamento de fontes e scripts de terceiros (Google Fonts, CDNs).
- **Decisão:** Utilizar o plugin `vite-plugin-singlefile` em `packages/mcp-ui` para gerar um arquivo HTML 100% autocontido, utilizando fontes de sistema nativas e mantendo o tamanho comprimido em $\sim 92\text{ KiB}$ gzip.
- **Consequências:** Compatibilidade universal em todos os clientes MCP sem falhas de carregamento de assets.
