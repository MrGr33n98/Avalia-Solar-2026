# Decisões Arquiteturais Registradas: SPEC 026 — Agentic Storefront

**Status:** Decisões Aprovadas  
**Data:** 26 de Novembro de 2026  

---

## ADR-026-001: Modelagem do Storefront em Rails 7 com Service Objects
- **Contexto:** Necessidade de prover vitrine B2B/B2C sem acoplar regras de negócio em controllers ou engordar o model `Company`.
- **Decisão:** Implementar `Storefront::PublicProfileService` como PORO (Plain Old Ruby Object), com autorização via Pundit e serialização via ActiveModelSerializers.
- **Consequências:** Manutenção da simplicidade 37signals Rails, isolamento de testes e facilidade de cache HTTP/Redis.

## ADR-026-002: Exposição Agent-Native via MCP e MCP Apps SDK
- **Contexto:** A vitrine do integrador deve ser consumível por agentes de IA e clientes web.
- **Decisão:** Registrar a ferramenta pública `show_storefront_profile` em `Mcp::PublicToolRegistry` e compilar a superfície standalone `ui://avalia-solar/storefront/v1.html` dentro do budget estrito de $\le 120\text{ KiB}$ gzip.
- **Consequências:** Experiência agentic de ponta a ponta sem violação de CSP.
