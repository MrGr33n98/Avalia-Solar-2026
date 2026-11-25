# Tokens e tipografia
Fonte canônica atual: `packages/mcp-ui/src/design/tokens.css`, `AB0-1-front/tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, ADR-005. Preservar aliases `--as-*`. Valores a seguir: cores observadas, escala adicional proposta.

| Token | Light / dark | Uso |
|---|---|---|
| brand-primary | #2563EB / #2563EB | ação; medir contraste |
| brand-primary-hover | #1D4ED8 | hover |
| brand-link | #1D4ED8 / #60A5FA | links |
| brand-green | #047857 / #34D399 | verificação |
| brand-solar | #F59E0B / #FBBF24 | estrelas com texto |
| brand-navy | #0F172A | marca |
| bg | host primary; #FFFFFF / #171717 | fundo |
| bg-subtle | host secondary; #F8FAFC / #212121 | cards |
| bg-muted | host tertiary; #F1F5F9 / #2A2A2A | neutro |
| text | host primary; #0F172A / #F8FAFC | texto |
| text-muted | #475569 / #CBD5E1 | secundário, host override |
| text-subtle | #64748B / #94A3B8 | metadados, host override |
| danger | #B91C1C / #F87171 | erro |

Fonte: host `--font-sans` → system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif. Frontend system-ui existente; não impor IBM Plex sem decisão e medição. Números tabulares.

| Papel | px / line-height | Peso |
|---|---|---|
| display | 28/34 | 600 |
| metric-xl | 24/30 | 600 |
| heading-1 | 20/26 | 600 |
| heading-2 | 18/24 | 600 |
| heading-3 | 15/20 | 600 |
| body | 14/20 | 400 |
| body-compact | 13/18 | 400 |
| button | 13/18 | 500 |
| label | 12/16 | 500 |
| caption | 12/16 | 400 |

Mapeamento opcional de classes shadcn scoped: `--primary: var(--as-brand-primary)`, `--background: var(--as-bg)`, `--foreground: var(--as-text)`, `--border: var(--as-border)`, `--muted: var(--as-bg-muted)`. Verificar sintaxe exigida por versão (cor completa vs canais HSL); não sobrescrever globals. Testar contraste normal 4.5:1, texto grande/controles 3:1 quando aplicável.
