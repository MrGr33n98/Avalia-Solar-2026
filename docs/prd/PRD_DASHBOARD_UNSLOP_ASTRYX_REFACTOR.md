# PRD: Refatoração do Dashboard Avalia Solar — Padrão Unslop & Astryx

**Documento de Requisitos de Produto (PRD)**  
**Versão:** 1.0.0  
**Status:** Aprovado para Execução  
**Data:** 23 de Novembro de 2026  
**Autor:** Equipe de Engenharia e Design Avalia Solar  
**Metodologia:** Spec Kit (spec.md, plan.md, tasks.md), TDD, Unslop Craft Principles, Astryx Design Guidelines

---

## 1. Visão Geral e Contexto

O **Dashboard Empresarial da Avalia Solar** (`/dashboard`) é o núcleo operacional onde integradores, fabricantes e distribuidores de energia solar gerenciam sua reputação auditada, acompanham métricas de tráfego, capturam e atendem leads, configuram produtos e interagem com ferramentas de IA e CRM.

A recente auditoria de gap revelou excelente amplitude funcional, mas identificou dívidas críticas em:
1. **Segurança e integridade multi-tenant (P0):** O parâmetro de URL `company_id=372` era ignorado quando havia estado prévio no `localStorage` ou cookies, podendo exibir a empresa errada ao acessar links diretos ou compartilhar sessões.
2. **Arquitetura de casca (Shell) e navegação duplicada (P0):** Múltiplos sidebars e shells concorrentes (`EnterpriseDashboard`, `DashboardLayout`, `CompanyDashboardModern`), com redundância de rotas e divergência entre abas (`info` vs `product-general`).
3. **Confiabilidade de dados e dados mock (P0):** Componentes como `DashboardCharts.tsx` continham dados mock estáticos (vendas, energia eólica, biomassa) que podiam poluir rotas reais; KPI de "Tempo médio de resposta" travado em `—` sem estado semântico explicável.
4. **Poluição visual e quebra dos princípios Unslop/Astryx (P1):** Mistura de claymorphism, gradientes chamativos de múltiplas cores, glows, cantos inflados, paywalls espalhafatosos (`FeatureGuard`) com claims não verificados ("Até 4x mais...", "8x mais leads").
5. **Acessibilidade e conformidade WCAG 2.1 AA (P1):** Botões de ícone sem `aria-label`, gráficos sem representação tabular alternativa, tags `<img>` gerando erros de lint/LCP.

Este PRD define os requisitos mínimos, as metas mensuráveis e o plano de ação rigoroso para transformar o dashboard em uma **sala de operações técnica, calma, consistente e 100% confiável**.

---

## 2. Personas e Casos de Uso

| Persona | Perfil | Caso de Uso Principal |
| :--- | :--- | :--- |
| **Integrador Solar (PME)** | Diretor ou Gerente Comercial de integradora local | Acessa para responder leads imediatos, conferir nota de reputação e ver se o perfil está completo. Precisa de zero ruído e de ações rápidas. |
| **Grande Fabricante / Distribuidor** | Gerente de Contas ou Marketing Corporativo (ex: WEG, SolarEdge) | Acessa via link direto com `company_id=XYZ`, gerencia múltiplos membros, acompanha métricas consolidadas e estúdio de IA. |
| **Administrador Geral (Avalia Solar)** | Super Admin / Suporte Interno | Acessa o dashboard de qualquer empresa via `company_id` com permissão de impersonation segura para prestar suporte. |

---

## 3. Requisitos Mínimos do Produto

### 3.1 Requisitos Funcionais e de Segurança (P0)

- **RF-01 (Seleção Confiável por URL `company_id`):**
  - Ao carregar `/dashboard?company_id=XYZ`, o sistema DEVE priorizar o `XYZ` informado.
  - O sistema DEVE validar se o usuário autenticado possui associação com a empresa `XYZ` (ou permissão administrativa de suporte).
  - Se autorizada, a empresa `XYZ` se torna a empresa ativa no `CompanyContext`, salvando no `localStorage`, sincronizando o cookie no backend e invalidando caches de empresas anteriores.
  - Se NÃO autorizada (tentativa de acesso a empresa de terceiro): o sistema DEVE rejeitar o acesso, NÃO exibir nenhum dado da empresa solicitada (proteção estrita contra IDOR), disparar notificação amigável de erro de autorização e carregar com segurança a empresa pertencente ao usuário ou redirecionar para `/select-company`.

- **RF-02 (Shell Oficial Único):**
  - `EnterpriseDashboard` é o shell oficial e exclusivo para o workspace empresarial.
  - Código legado morto (`CompanyDashboardModern.tsx`, layouts duplicados sem uso) DEVE ser completamente isolado ou descontinuado, garantindo que não seja invocado em nenhuma rota de produção.

- **RF-03 (Unificação da Navegação e Eliminação de Rotas Fantasma):**
  - A navegação lateral e mobile DEVE derivar exclusivamente da matriz centralizada de `config/navigation.ts`.
  - O identificador das abas DEVE ser unificado: ações de "Completar perfil" que apontavam para `info` devem corresponder exatamente à rota canônica de perfil empresarial (`info` ou `product-general`), sem deixar a tela vazia.
  - O botão "Ajuda" na interface DEVE executar uma ação real: abrir canal de suporte oficial / FAQ ou acionar modal de assistência.

- **RF-04 (Confiabilidade de Dados — Zero Mocks em Produção):**
  - Gráficos e tabelas não devem exibir séries artificiais ("Eólica", "Biomassa", "Vendas fictícias").
  - Quando não houver dados registrados para o período, o componente DEVE exibir um estado vazio explícito, com instrução de como começar a gerar dados.
  - O KPI "Tempo médio de resposta" não deve ficar travado em `—`: deve exibir a métrica real se disponível, ou estado explícito ("Não configurado" / "Sem interações no período"), com link para ativar o canal de atendimento.

---

### 3.2 Requisitos Visuais (Diretrizes Unslop & Astryx) (P1)

- **RV-01 (Cores e Calma Visual):**
  - Chrome silencioso: superfícies neutras de alto contraste baseadas na escala de cinzas e grafite.
  - Eliminar gradientes espalhafatosos de múltiplas tonalidades (roxo, rosa, ciano concorrentes) em superfícies e textos.
  - Eliminar sombras coloridas, glows e fundos com manchas neon.
  - Usar um único tom de destaque corporativo solar (âmbar/dourado refinado) para seleção e ação principal. Cores semânticas (verde/vermelho) apenas para indicadores de status.

- **RV-02 (Grade Estrita de Espaçamento e Tipografia):**
  - Todo espaçamento, padding, margin e gap deve seguir a escala de 4px (4, 8, 12, 16, 20, 24, 32px).
  - Raios concêntricos proporcionais (ex: 8px para botões/inputs, 12px ou 16px para cards; eliminar cantos exagerados como `rounded-3xl` em painéis operacionais).
  - Tipografia funcional: títulos descritivos e operacionais ("Painel Operacional — [Empresa]"), eliminando saudações decorativas desnecessárias.

- **RV-03 (Paywall e FeatureGuard Sóbrios):**
  - Redesenhar `FeatureGuard`: substituir o visual de "marketing agressivo" e gradientes fluorescentes por um card calmo e elegante.
  - Remoção de claims infundados ("Até 4x mais visualizações", "8x mais leads").
  - Estrutura clara: (1) O que é o recurso, (2) Qual o benefício prático, (3) Qual o plano mínimo necessário (ex: Pro), (4) Botão de upgrade direto.

---

### 3.3 Requisitos de Acessibilidade e Qualidade Técnica (P1)

- **RA-01 (Acessibilidade de Controles e Botões):**
  - Todo botão que contenha apenas ícone (ex: download de gráfico, fechar modal, alternar visualização) DEVE possuir `aria-label` e atributo `title` descritivos.
- **RA-02 (Alternativa Tabular para Gráficos):**
  - Gráficos do Overview e de métricas DEVEM possuir alternativa tabular acessível (tabela oculta para leitores de tela ou botão para visualizar os dados em formato de tabela semântica com `caption`, `thead` e `tbody`).
- **RA-03 (Imagens Otimizadas):**
  - Substituir qualquer elemento `<img>` direto no código do dashboard por `<Image />` do `next/image` ou ícones SVG vetoriais.
- **RA-04 (Qualidade de Código & Testes):**
  - 100% dos testes unitários e de integração relevantes passando em Jest.
  - Zero erros de ESLint nos componentes centrais do dashboard.
  - Conformidade estrita com TypeScript (`npm run typecheck`).

---

## 4. Metas e Indicadores de Sucesso (KPIs)

| Meta | Indicador | Alvo |
| :--- | :--- | :--- |
| **M1: Integridade Multi-tenant** | Testes de seleção por `company_id` | 100% de cobertura nos cenários (URL autorizada, URL de terceiro bloqueada, URL nula). |
| **M2: Zero Vazamento / Zero Mocks** | Auditoria de componentes em rota real | 0 dados mock estáticos em produção. |
| **M3: Acessibilidade** | Violações a11y em botões e gráficos | 0 botões sem `aria-label`; alternativa tabular disponível. |
| **M4: Qualidade de Código** | ESLint & TypeCheck | 0 erros de linting nos arquivos do dashboard; TypeScript verde. |
| **M5: Consistência Visual** | Aderência aos tokens Unslop/Astryx | Redução total de glows neon, gradientes concorrentes e claims inflados. |

---

## 5. Próximos Passos (Spec Kit)

A execução deste PRD seguirá a estrutura Spec Kit em `specs/017-dashboard-unslop-astryx/`:
1. `spec.md`: Especificação técnica detalhada das interfaces, contratos e regras de negócio.
2. `plan.md`: Plano de execução e arquitetura técnica detalhada fase a fase.
3. `tasks.md`: Lista de tarefas com rastreamento contínuo até conclusão.

