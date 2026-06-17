# Estrutura do Diretório - Avalia Solar

Este documento descreve o layout de arquivos e pastas do monorepo/multi-repo local **Avalia Solar**, mapeando as localizações dos componentes chaves da aplicação.

---

## 📁 Estrutura Geral do Workspace

O projeto é estruturado em duas pastas de alto nível no diretório raiz:
*   [AB0-1-front/](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front) - Projeto Frontend em Next.js.
*   [AB0-1-back/](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back) - Projeto Backend em Ruby on Rails.

---

## 💻 Frontend Structure (`AB0-1-front/`)

O frontend em Next.js com App Router possui a seguinte estrutura organizacional:

```
AB0-1-front/
├── app/                        # Next.js App Router (Roteamento & Páginas)
│   ├── (auth)/                 # Grupo de rotas autenticadas
│   ├── api/                    # Rotas de API local do Next.js (Edge/BFF)
│   ├── categories/             # Páginas públicas de categorias (ex: painéis, inversores)
│   ├── companies/              # Páginas públicas de empresas parceiras/integradoras
│   ├── dashboard/              # Painel B2C/B2B do cliente no Next.js
│   ├── pricing/                # Página pública de preços de banners e planos
│   ├── reviews/                # Página de submissão e visualização de avaliações
│   ├── layout.tsx              # Layout global raiz (HTML, Body, Providers)
│   └── page.tsx                # Home Page do portal Avalia Solar
├── components/                 # Componentes compartilhados e de UI
│   ├── ui/                     # Componentes primitivos baseados em Radix / Shadcn
│   ├── BannerContainer.tsx     # Gerenciador e renderizador de Banners e Carrosséis
│   └── Sidebar.tsx             # Barra lateral comum
├── hooks/                      # Custom hooks com lógica de fetch/sincronização
├── contexts/                   # Provedores de contextos React (Auth, Theme)
├── lib/                        # Configurações de clientes (Sentry, Tanstack Query)
├── public/                     # Assets estáticos (imagens, ícones, logos locais)
├── types/                      # Definições globais de tipos TypeScript
├── utils/                      # Funções auxiliares e formatadores comuns
├── playwright.config.ts        # Arquivo de configuração dos testes E2E Playwright
└── tailwind.config.ts          # Configuração de design system e tokens do Tailwind CSS
```

---

## ⚙️ Backend Structure (`AB0-1-back/`)

O backend Rails segue a estrutura clássica MVC com as adaptações para uma API moderna e sistema Hotwire:

```
AB0-1-back/
├── app/
│   ├── controllers/            # Controladores do Rails (API, Hotwire e Admin)
│   │   ├── admin/              # Customização de controllers do ActiveAdmin
│   │   ├── api/v1/             # Endpoints REST expostos ao Next.js
│   │   │   ├── auth_controller.rb
│   │   │   ├── leads_controller.rb
│   │   │   └── companies_controller.rb
│   │   └── app/                # Lógica do subdomínio app. (Hotwire)
│   ├── jobs/                   # Tarefas assíncronas do Sidekiq
│   │   ├── process_webhooks_job.rb
│   │   └── send_otp_job.rb
│   ├── models/                 # Modelos do ActiveRecord (Lógica de dados e regras)
│   │   ├── user.rb
│   │   ├── lead.rb
│   │   ├── company.rb
│   │   └── banner.rb
│   ├── serializers/            # Serializadores JSON (ActiveModelSerializers)
│   │   ├── user_serializer.rb
│   │   └── company_serializer.rb
│   └── views/                  # Rails Views e Componentes de UI do subdomínio app.
│       ├── app/                # Telas do painel (Integradores, Projetos)
│       └── layouts/            # Layouts principais (Puma, ActionCable e Devise)
├── config/                     # Configurações gerais da aplicação
│   ├── environments/           # Ajustes específicos (development, production, staging)
│   ├── initializers/           # Scripts rodados no boot (Redis, Sidekiq, Sentry)
│   ├── database.yml            # Configuração do banco Postgres e SQLite
│   ├── routes.rb               # Mapeamento detalhado de rotas do rails
│   └── sidekiq_schedule.yml    # Agendamento de cron jobs periódicos
├── db/                         # Migrações ActiveRecord e Seeds de Banco
│   ├── migrate/                # Histórico de alterações estruturais do DB
│   └── seeds.rb                # Dados iniciais para novos ambientes
└── spec/                       # Testes automatizados do RSpec
    ├── factories/              # Fábricas de objetos para testes (FactoryBot)
    ├── models/                 # Testes unitários de modelos
    └── requests/               # Testes de integração de endpoints de API
```
