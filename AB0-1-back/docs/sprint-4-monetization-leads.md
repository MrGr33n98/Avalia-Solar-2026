Aqui está a Sprint 4 final, em um único arquivo Markdown completo e coeso. Mantive tudo o que o dev sugeriu originalmente (estrutura, US15 a US18 com descrições próximas, subtarefas backend/frontend, métricas, notas de handoff), mas incorporei de forma natural e integrada a nossa sugestão principal: distribuição exclusiva para empresas com plano ativo, filtro por categoria/niche quando o lead tem interesse específico, reforço na monetização, visibilidade no Active Admin e métricas alinhadas ao paywall.
Markdown# Sprint 4: Monetização & Inteligência de Leads

**Epic:** MVP Top Companies & SEO Base  
**Objetivo do Sprint:** Maximizar o ROI das empresas Premium (Top 3 e demais pagantes) através de distribuição **exclusiva e prioritária de leads para assinantes ativos**, CTAs de conversão agressivos e ferramentas de comparação que destacam a liderança.

---

## 📋 Tabela de Histórias (Planejamento)

| ID     | Título                                      | Prioridade | Status | Descrição Técnica                                                                 |
|--------|---------------------------------------------|------------|--------|-----------------------------------------------------------------------------------|
| **US15** | Lead Distribution Engine                    | Must       | Ready  | Implementar lógica no backend que, ao receber um lead "geral" (sem empresa alvo), distribui automaticamente **apenas para empresas com plano ativo** (subscription status 'active' e end_date vigente), priorizando medalha de Ouro > Prata > Bronze daquela cidade/região. Se o lead indicar interesse em categoria específica, filtrar por niche_tags ou categorias atendidas. |
| **US16** | CTA Flutuante Top 1                         | Must       | Ready  | Criar um componente "Sticky CTA" no mobile exclusivo para a empresa que detém o 1º lugar no ranking da página atual (visível apenas se plano ativo). Layout flutuante inferior com foto do especialista e botão WhatsApp/Orçamento. |
| **US17** | Tracking Premium Dashboard                  | Should     | Ready  | Implementar eventos de Analytics específicos para cliques em badges de ranking e tooltips patrocinados, exibindo um mini-resumo no Admin com: leads prioritários recebidos, leads pagos vs. totais, taxa de resposta e comparação com não-pagantes. |
| **US18** | Comparison Pro Mode                         | Could      | Ready  | Refatorar a ferramenta de comparação para destacar selos de ranking (ex: "Líder de Florianópolis") e selo "Plano Premium Ativo" quando duas empresas forem comparadas. |
| **US19** | Active Admin – Leads & Monetização          | Must       | New    | Adicionar na aba Leads: filtro "Apenas Pagantes", coluna "Plano Ativo?" e "Categoria do Lead". Na aba Companies: seção "Performance Premium" com contagem de leads prioritários/pagantes recebidos + estimativa de leads elegíveis (baseado em plano + categorias). |

---

## 🛠️ Sub-tarefas Técnicas Iniciais

### **[BACKEND]**

- **Distribution Logic**  
  Criar Service `Leads::PriorityDistributor` (ou `Leads::PayingDistributor`) para:  
  - Filtrar empresas `paying_and_active` (joins com subscriptions: status 'active' e end_date > now)  
  - Ordenar por prioridade (Ouro > Prata > Bronze > demais pagantes)  
  - Se lead tiver categoria/niche_tags → aplicar filtro `.eligible_for_category(lead.categories)`  

- **Model/Scope no Company** (sugestão de implementação)  
  ```ruby
  scope :paying_and_active, -> {
    joins(:subscription)
      .where(subscriptions: { status: 'active' })
      .where('subscriptions.end_date > ?', Time.current)
  }

  scope :eligible_for_category, ->(categories) {
    where("niche_tags && ARRAY[?]::varchar[]", categories)
    # ou: joins(:categories).where(categories: { id: categories }) se usar relação
  }

Analytics API
Criar novos tipos de eventos no model AnalyticsEvent para rastrear:
ranking_badge_click
winner_badge_download
lead_delivered_to_paying
lead_qualified_by_category (opcional)

Active Admin
Adicionar seção "Performance Premium" no show da empresa com:
Contagem de leads prioritários/pagantes recebidos
Estimativa de leads potenciais (baseado em plano + categorias)

Na aba Leads: filtro "Apenas Pagantes" + colunas "Plano Ativo?" e "Categoria do Lead"


[FRONTEND]

Top1StickyCTA
Componente que aparece apenas se rank === 1e empresa tem plano ativo. Layout flutuante inferior com foto do especialista e botão WhatsApp.
Comparison Enhancement
Adicionar linha "Posição no Ranking" e selo "Plano Premium Ativo" na tabela de comparação (/compare).
Lead Modal Integration
Garantir que o source do lead identifique origem: "Ranking Destaque", "Categoria [slug]", "Formulário Categoria".


📈 Métricas de Sucesso da Sprint

Lead Velocity
Aumento de 30% na velocidade de entrega de leads para parceiros Premium (pagantes ativos).
CTR (Click-Through Rate)
Taxa de clique nos badges de Top 3 superior a 15% em relação aos cards comuns.
Monetização & Qualidade
100% dos leads distribuídos vão para empresas com plano ativo (zero vazamento para não-pagantes).
Transparência
Gerar o primeiro log de "Leads por Mérito/Pagamento" no banco de dados + exibir no Admin leads perdidos por falta de plano ativo.


🚀 Notas de Handoff

Branch Sugeridafeat/sprint-4-monetization
Ambiente
Testes rigorosos de distribuição de leads em Staging, incluindo cenários:
Lead geral → só pagantes (prioridade ranking)
Lead por categoria → só pagantes que atendem a categoria
Empresa sem plano ativo → não recebe lead

Design
Manter a consistência das cores metálicas (Gold/Silver/Bronze) nas chamadas de ação + selo "Premium Ativo" em verde para reforçar valor.
Riscos Pendentes
Se não houver pagantes suficientes em uma cidade/categoria → definir fallback (fila, notificar admin, etc.)
Critério exato de ordenação dentro dos pagantes (local vs. global) → alinhar em refinement


Essa sprint mantém a essência da sugestão original (foco em Top 3, medalhas, sticky CTA, tracking, comparison), mas evolui para um modelo de monetização sólido e protegido. Bora implementar e faturar com leads de qualidade!
Felipe – qualquer ajuste final antes de kickoff, avisa.