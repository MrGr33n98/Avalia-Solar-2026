# Sprint 5: Dashboard B2B, Retenção & Ecossistema
**Epic:** MVP Top Companies & SEO Base
**Objetivo do Sprint:** Consolidar a proposta de valor para os parceiros Premium (Top 3) através de dashboards de transparência, automação de relatórios e ferramentas de marketing externo (Widgets).

---

## 📋 Tabela de Histórias (Planejamento Final)

| ID | Título | Prioridade | Status | Descrição Técnica |
| :--- | :--- | :---: | :---: | :--- |
| **US19** | Ranking Performance Dashboard | Must | Ready | Criar uma nova aba "Ranking" no Dashboard da Empresa para mostrar métricas de: "Vezes no Top 3", "Cliques no Badge" e "Leads por Mérito". |
| **US20** | Automated Performance Insights | Should | Ready | Implementar um worker/job para gerar resumos semanais de performance. Preparar estrutura para envio de E-mail/WhatsApp. |
| **US21** | Ranking Milestone Alerts | Could | Ready | Sistema de notificações internas: "Parabéns! Sua empresa alcançou o 1º lugar em [Cidade] esta semana". |
| **US22** | Dynamic Badge Widget (v1) | Must | Ready | Desenvolver um script JS injetável (Iframe ou WebComponent) para que a empresa possa exibir seu selo de "Empresa Ouro/Verificada" em seu próprio site. |

---

## 🛠️ Sub-tarefas Técnicas Iniciais

### **[BACKEND]**
- **Stats API:** Criar endpoint `/api/v1/company_dashboard/ranking_stats` que agrega eventos de `ranking_click` e posições históricas.
- **Badge Generator:** Endpoint que retorna um SVG ou imagem dinâmica do selo atual da empresa baseado no score (para uso no Widget).
- **Automation:** Criar `Ranking::WeeklySummaryJob` para processar os destaques da semana por categoria.

### **[FRONTEND]**
- **Dashboard View:** Criar componente `RankingInsights` com gráficos simples (Bar/Line) de visibilidade.
- **Widget Builder:** Uma página simples no dashboard onde a empresa copia o código `<script>` para o site dela.
- **Success UI:** Modal de celebração quando a empresa abre o dashboard e subiu de posição no ranking.

---

## 📈 Métricas de Sucesso do Epic (Final)
- **Churn Reduction:** Redução de cancelamentos de planos Premium ao mostrar dados claros de ROI.
- **B2B Growth:** Pelo menos 10% das empresas Top 3 instalando o widget em sites externos (SEO Backlinks).
- **Data Accuracy:** 100% de consistência entre o que o Admin vê e o que o cliente vê no Dashboard.

---

## 🏁 Encerramento do Epic
Ao final desta sprint, o sistema de "Top Companies" deixará de ser uma funcionalidade isolada para se tornar o principal motor de vendas e autoridade do **AvaliaSolar 2026**.

---

## 🚀 Notas de Handoff
- **Branch Final:** `feat/sprint-5-retention-complete`
- **Ambiente:** Testes de integração com sites externos (CORS/Widget) em ambiente de homologação.
- **Marketing:** Preparar material de anúncio: "Novo Painel de Performance para Parceiros".
