# Prompt para Geração de Novos Negócios com o Blueprint

Você pode usar o prompt abaixo em assistentes de IA (como Claude, ChatGPT ou GitHub Copilot) para acelerar a adaptação deste blueprint genérico para a regra de negócio do seu novo projeto.

---

## 📋 Copie e Cole o Texto Abaixo:

**Contexto:**
Estou iniciando um novo projeto usando um Blueprint arquitetural baseado em Ruby on Rails (Backend), Next.js + Tailwind + Shadcn (Frontend) e PostgreSQL + Redis (Infraestrutura). 
A arquitetura base já resolve autenticação (Devise), painel admin (ActiveAdmin), background jobs (Sidekiq) e tracking (PostHog).

**O Novo Negócio:**
[ DESCREVA AQUI O SEU NOVO NEGÓCIO. Ex: Um marketplace para aluguel de equipamentos de construção, onde usuários podem anunciar máquinas e locatários podem alugá-las por dia. ]

**Objetivo:**
Com base no negócio acima, aja como um Arquiteto de Software Sênior e gere:

1. **Modelagem de Dados (Entity Relationship):**
   - Liste os modelos principais (tabelas do banco).
   - Defina os atributos e tipos de dados de cada modelo.
   - Defina os relacionamentos (has_many, belongs_to, etc).

2. **Rotas e Endpoints da API (Backend):**
   - Quais endpoints RESTful o Next.js vai precisar consumir?
   - Quais actions estarão restritas para usuários autenticados?

3. **Arquitetura de Páginas do Next.js (Frontend):**
   - Estrutura sugerida de pastas no `/app` ou `/pages`
   - Principais componentes React que deverão ser criados (ex: `EquipmentCard`, `BookingForm`).

4. **Painel Admin (ActiveAdmin):**
   - Quais recursos o administrador do sistema precisa gerenciar?
   - Quais filtros ou dashboards seriam essenciais para o negócio?

5. **Regras de Negócio Críticas / Background Jobs:**
   - Quais rotinas assíncronas precisaremos? (ex: `BookingReminderJob`, `PaymentProcessingWorker`).

Por favor, me entregue isso em formato de checklist acionável, com exemplos de código Rails (Migrations e Models) e Next.js (Types/Interfaces) para que eu possa começar a codificar imediatamente em cima do meu blueprint genérico.
