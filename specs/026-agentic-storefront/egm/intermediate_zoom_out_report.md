# Intermediate Zoom Out Report: SPEC 026 — Agentic Storefront

**Fase EGM:** Estágio 8 — Intermediate Zoom Out & TRIZ Governance  
**Revisores:** `egm-zoom-out` (Skeptical Architect), `egm-inventive-catalyst` (TRIZ Specialist)  
**Data da Auditoria:** 26 de Novembro de 2026  
**Status da Rodada:** **CONCLUÍDO (COMPLEXIDADE ACIDENTAL ELIMINADA)**  
**Referência Canônica:** `specs/026-agentic-storefront/spec.md`  

---

## 1. Visão Geral da Auditoria Intermediária

O **Estágio 8 (Intermediate Zoom Out)** atua como um freio de arrumação após as correções intensas do Estágio 7 (Design Critique). O risco comum em projetos de engenharia é que, ao resolver vulnerabilidades e apontamentos de segurança/performance, os desenvolvedores introduzam:
- Novas bibliotecas ou dependências npm/gem desnecessárias.
- Camadas de abstração excessivas (over-engineering).
- Contradições no modelo mental do sistema.

Os revisores deste estágio verificam se a arquitetura continuou limpa, minimalista e pragmática (padrão 37signals Rails).

---

## 2. Análise de Complexidade Acidental Pós-Estágio 7

| Solução Proposta no Estágio 7 | Avaliação de Complexidade (`egm-zoom-out`) | Veredito |
|---|---|:---:|
| **Proteção Anti-IDOR via Pundit (`StorefrontPolicy`)** | Utiliza a infraestrutura de autorização já existente do Rails sem adicionar nenhuma gem. | **APROVADO (Zero Complexidade Acidental)** |
| **Mitigação de N+1 via `includes`** | Padrão nativo do ActiveRecord, amplamente suportado e verificado pelo `Bullet`. | **APROVADO** |
| **Proteção LGPD e Sanitização Zod** | Reuso do Zod no frontend e métodos nativos do Rails para sanitização de strings. | **APROVADO** |
| **Singlefile CSP para MCP Apps SDK** | Reuso do `vite-plugin-singlefile` já configurado no `packages/mcp-ui`. | **APROVADO** |
| **Rate Limiting no Rack::Attack** | Reuso do initializer `config/initializers/rack_attack.rb` já existente no repositório. | **APROVADO** |

---

## 3. Resolução de Contradições de Sistema via TRIZ (`egm-inventive-catalyst`)

### Contradição TRIZ 1: Vitrine Visualmente Rica vs Limite de $\le 120\text{ KiB}$ Gzip
* **Problema:** Um integrador deseja exibir carrossel de fotos de projetos, gráfico de geração solar, comparativo de kits e rascunho de orçamento. Incluir todas essas bibliotecas no bundle compilado do MCP facilmente ultrapassaria 300 KiB.
* **Princípio TRIZ Aplicado (Princípio 1 — Segmentação & Princípio 2 — Extração/Separação):**
  * O bundle base do Storefront contém apenas os componentes estruturais essenciais e estilos Tailwind pré-purgados (~80 KiB gzip).
  * O cálculo solar utiliza funções matemáticas puras sem bibliotecas gráficas pesadas.
  * O carrossel de projetos utiliza scroll-snap nativo CSS puro (`scroll-snap-type: x mandatory`), dispensando bibliotecas externas como Swiper ou Embla.
* **Resultado:** Riqueza visual idêntica à web com **bundle final estimado em $\sim 92\text{ KiB}$ gzip**, respeitando folgadamente o limite de 120 KiB.

### Contradição TRIZ 2: Customização B2B pelo Integrador vs Integridade do Design System (AS-EDS)
* **Problema:** O integrador quer que a vitrine pareça com a sua identidade visual (cor da marca, headline própria), mas o Avalia Solar precisa garantir consistência estética, legibilidade e acessibilidade WCAG.
* **Princípio TRIZ Aplicado (Princípio 3 — Qualidade Local & Princípio 22 — Transformação de Prejuízo em Benefício):**
  * O integrador pode customizar apenas tokens controlados: a cor primária de destaque (botão e acentos) e a headline comercial.
  * O sistema valida o contraste da cor escolhida contra o fundo via algoritmo relativo (`contrastRatio >= 4.5:1`), aplicando fallback automático caso o contraste seja ilegível.
* **Resultado:** O integrador sente que a vitrine é sua, enquanto a plataforma garante conformidade WCAG AA e estética premium.

---

## 4. Conclusão do Estágio 8

Nenhuma nova dependência externa foi adicionada ao projeto. O modelo arquitetural mantém-se enxuto, eficiente e alinhado aos princípios fundamentais do repositório.

**Avanço para Estágio 9 (Implementation Readiness) autorizado.**
