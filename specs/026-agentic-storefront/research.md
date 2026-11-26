# Benchmark e Pesquisa Técnica: SPEC 026 — Agentic Storefront

**Versão:** 0.1.0  
**Data:** 26 de Novembro de 2026  

---

## 1. Benchmarks de Mercado

### 1.1 G2 Product & Vendor Storefronts
- **Pontos Fortes:** Foco em validação de autenticidade (badges, grid reports), avaliações estruturadas com perguntas específicas (prós/contras), integração com CRM via MCP e formulários de contato de alta conversão.
- **Adaptação para Avalia Solar:** Uso de selos auditados ("Empresa Verificada", "Instalador Homologado Tier 1"), notas com amostragem explícita e CTA claro para proposta sem fricção.

### 1.2 EnergySage & SolarReviews
- **Pontos Fortes:** Calculadora de dimensionamento fotovoltaico integrada diretamente na vitrine da empresa; comparador de equipamentos homologados; transparência de garantias.
- **Adaptação para Avalia Solar:** Inclusão dos blocos `solar-calculator` e `financing-simulator` já validados no `@avalia-solar/mcp-ui`, permitindo ao comprador calcular sua economia antes de pedir o orçamento.

### 1.3 Storefronts Nativos para Agentes de IA (Agentic Storefronts)
- **Diferencial Competitivo:** Os concorrentes tradicionais dependem 100% da navegação web. O Avalia Solar é pioneiro em expor vitrines agent-native através de ferramentas MCP e widgets interativos (`ui://`), permitindo que assistentes de IA recomendem e exibam o storefront do integrador diretamente na conversa.

---

## 2. Decisões Tecnológicas e Restrições

| Dimensão | Escolha Tecnológica | Justificativa Técnica |
|---|---|---|
| **Backend Core** | Rails 7 + PostgreSQL 14 | Baixa complexidade acidental, estabilidade transacional e reuso de models consolidados |
| **API Pública** | REST v1 + ActiveModelSerializers | Cache HTTP e CDN trivial, contrato estável com Zod no frontend |
| **Agent Interface** | MCP JSON-RPC 2.0 (`/mcp`) | Compatibilidade universal com clientes MCP sem dependência de browser |
| **Interactive UI** | `@avalia-solar/mcp-ui` (Vite singlefile) | Carregamento autocontido em iframes seguros com CSP restrita |
| **Web Frontend** | Next.js 14 App Router (ISR) | SEO otimizado, Core Web Vitals elevados e hidratação seletiva |
| **Dashboard B2B** | Hotwire / React Islands (SPEC 022) | Continuidade visual com o Company Dashboard existente |
