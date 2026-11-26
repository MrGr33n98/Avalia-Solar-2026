# Initial Zoom Out Report: SPEC 026 — Agentic Storefront

**Fase EGM:** Estágio 5 — Initial Zoom Out Review  
**Revisores:** `egm-zoom-out` (Skeptical Architect), `egm-inventive-catalyst` (TRIZ Specialist), `as-product-reviewer`  
**Data da Auditoria:** 26 de Novembro de 2026  
**Status da Rodada:** **CONCLUÍDO (CONVERGÊNCIA ATINGIDA)**  
**Referência Canônica:** `specs/026-agentic-storefront/spec.md`  

---

## 1. Visão Geral e Alinhamento Estratégico

O objetivo do **Estágio 5 (Initial Zoom Out)** é desafiar criticamente a existência e o escopo da **SPEC 026 (Agentic Storefront)** antes que qualquer linha de código seja escrita. O revisor cético atua para responder três perguntas fundamentais:
1. *A proposta resolve a dor correta de negócio do integrador e do consumidor?*
2. *Existe complexidade desnecessária, duplicação de esforço ou sobre-engenharia que possa ser eliminada?*
3. *Existem alternativas mais simples, baratas e manuteníveis (filosofia 37signals Rails) para entregar o mesmo valor?*

---

## 2. Avaliação de Proposta de Valor e Dor Real

### 2.1 A Dor do Integrador Solar (B2B)
* O integrador solar brasileiro de médio e pequeno porte sofre com sites lentos, falta de credibilidade perante o cliente final e custo exorbitante de ferramentas de geração de leads que entregam contatos frios.
* O perfil padrão de diretório (`/companies/:slug`) é passivo e informativo, mas não funciona como uma página de vendas (landing page de conversão) dedicada.
* **Veredito do Zoom Out:** A dor é legítima e central para a monetização da plataforma. O integrador precisa de uma vitrine moderna, com sua marca em destaque, portfólio de projetos instalados comprovados e simulador integrado que entregue um lead aquecido.

### 2.2 O Diferencial Agentic (MCP)
* No modelo tradicional, o comprador procura o integrador na web. No modelo de agentes (2026/2027), o comprador pergunta a um LLM (ChatGPT, Claude, Gemini): *"Qual o melhor integrador para instalar 6kWp em Campinas?"*.
* Se o Avalia Solar fornecer apenas um link de texto, a taxa de rejeição é alta. Ao fornecer uma superfície interativa (`ui://avalia-solar/storefront/v1.html`), o agente abre a vitrine do integrador diretamente no chat, permitindo simulação e rascunho de proposta sem sair da conversa.
* **Veredito do Zoom Out:** Essa é uma capacidade defensável de altíssimo valor que posiciona o Avalia Solar como pioneiro mundial em comércio conversacional solar.

---

## 3. Findings e Apontamentos do Estágio 5

### [F-05-01] [MAJOR] Risco de Duplicação de Regras de Negócio entre Brand Page e Storefront
* **Apontamento (`egm-zoom-out`):** A especificação original sugere que o Storefront (`/storefront/:slug`) terá seu próprio conjunto de rotas, serializadores e entidades, criando o risco de duplicar a lógica da Brand Page (`/companies/:slug`). Se o integrador alterar seu telefone ou horário de atendimento, precisaria alterar em dois locais?
* **Análise Crítica:** Duplicar modelos ou criar controllers isolados que não compartilham a raiz `Company` viola o princípio 37signals de simplicidade.
* **Ação Corretiva:** Estabelecer como regra arquitetural que `Storefront` é apenas uma **visão especializada (View-Model / DTO)** de `Company`. Toda a inteligência de reputação, avaliações, selos e contatos continua residindo estritamente em `Company`. A tabela nova é restrita a `storefront_settings` (1:1 com `Company`), guardando apenas preferências de exibição (headline customizada, projetos em destaque, kits selecionados).
* **Classificação:** `RESOLVED` (incorporado à especificação e modelo de dados).

### [F-05-02] [MAJOR] Complexidade Excessiva de Simulação de Financiamento no MCP
* **Apontamento (`egm-inventive-catalyst`):** Incluir simulação completa de crédito bancário com análise de propostas (financiamento Santander, BV, Solfácil) dentro da superfície agentic MCP (`show_storefront_profile`) viola o budget estrito de $\le 120\text{ KiB}$ gzip e adiciona complexidade transacional desnecessária ao MVP.
* **Princípio TRIZ Aplicado (Separação no Tempo e no Espaço):** A vitrine do agente deve focar na **simulação de irradiação solar e economia mensal (kWh e R$)**, que é uma conta determinística leve executada no client em < 5 KiB de código. A contratação financeira detalhada é uma etapa posterior que deve ser despachada para o fluxo completo do marketplace ou tratada via webhook pós-lead.
* **Ação Corretiva:** Limitar o widget do Storefront à `solar-calculator` básica (dimensionamento de potência e economia em R$/ano). A simulação bancária detalhada fica postergada para a Fase 2 pós-MVP.
* **Classificação:** `RESOLVED`.

### [F-05-03] [NIT] Distinção Conceitual entre Fabricante e Integrador
* **Apontamento (`as-product-reviewer`):** O texto da `spec.md` mistura o conceito de fabricantes de equipamentos (como WEG, Canadian Solar) com integradores de instalação (empresas locais).
* **Ação Corretiva:** Clarificar que o **Agentic Storefront é exclusivo para empresas do tipo `integrador` ou `distribuidor`**, enquanto fabricantes possuem Brand Pages institucionais com catálogo de equipamentos.
* **Classificação:** `RESOLVED`.

---

## 4. Conclusão do Estágio 5

A proposta da SPEC 026 foi aprovada pelo comitê cético do Zoom Out. Com o isolamento das configurações em `storefront_settings` e o foco no simulador fotovoltaico essencial, a complexidade acidental foi eliminada, preservando a aderência total à filosofia 37signals Rails.

**Avanço para Estágio 6 autorizado.**
