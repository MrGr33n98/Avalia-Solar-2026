# Stack de Tecnologia - Avalia Solar

Este documento descreve o ecossistema tecnológico do projeto **Avalia Solar**, detalhando as linguagens, frameworks, gerenciadores de dependências e configurações de infraestrutura e runtime tanto para o Frontend quanto para o Backend.

---

## 🚀 Visão Geral da Arquitetura Híbrida
O Avalia Solar é construído com uma abordagem moderna de duas pontas:
1. **Frontend Principal (B2C/B2B público):** Desenvolvido em Next.js 14 consumindo a API REST do backend.
2. **Backend e Plataforma de Gestão (subdomínio `app.`):** Desenvolvido em Ruby on Rails 7 que fornece tanto uma API REST v1 para o Next.js quanto páginas renderizadas pelo próprio servidor (SSR) via Hotwire (Turbo/Stimulus) no subdomínio `app.avaliasolar.com.br` para gerenciamento interno de integradores e projetos.

---

## 💻 Frontend (`AB0-1-front`)

O frontend é uma aplicação moderna baseada em React e Next.js com foco em alta performance, SEO e ótima experiência do usuário.

### Tecnologias Principais
*   **Runtime:** Node.js (versão recomendada >= 18)
*   **Framework:** [Next.js v14.2.34](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/package.json#L69) (App Router)
*   **Linguagem:** TypeScript v5.2.2 (configurado em [tsconfig.json](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/tsconfig.json))
*   **Estilização:** Tailwind CSS v3.3.3 (configurado em [tailwind.config.ts](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/tailwind.config.ts)) + PostCSS + Autoprefixer
*   **Biblioteca UI:** React v18.2.0

### Bibliotecas de Estado e Dados
*   **Chamadas de API e Cache:** `@tanstack/react-query` v5.90.12 (React Query para sincronização de estado com o servidor)
*   **Estado Global Client-Side:** `zustand` v5.0.11
*   **Banco de Dados Local (PWA/Offline):** `dexie` v4.3.0 (Wrapper elegante sobre IndexedDB)
*   **Validação e Formulários:** `react-hook-form` v7.63.0 integrado com `zod` v3.25.76 e `@hookform/resolvers` v3.10.0

### Componentes & Animações
*   **Componentes Primitivos Sem Estilo:** Radix UI (Accordion, Alert Dialog, Aspect Ratio, Avatar, Checkbox, Dialog, Dropdown Menu, Popover, Select, etc.)
*   **Animações Fluídas:** `framer-motion` v12.26.1
*   **Carrosséis:** `embla-carousel-react` v8.6.0 e `embla-carousel-autoplay` v8.6.0
*   **Gráficos:** `recharts` v2.12.7
*   **Ícones:** `lucide-react` v0.446.0

---

## ⚙️ Backend (`AB0-1-back`)

O backend é um monólito robusto em Ruby on Rails responsável pela persistência dos dados, lógica de negócios, tarefas em segundo plano e a API REST do ecossistema.

### Tecnologias Principais
*   **Runtime:** Ruby ~> 3.2 (especificado em [Gemfile:L4](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/Gemfile#L4))
*   **Framework:** [Ruby on Rails v7.0.8](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/Gemfile#L8)
*   **Servidor Web:** Puma v5.0 (configurado em [config/puma.rb](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/config/puma.rb))
*   **Gerenciador de Jobs:** Sidekiq ~> 7.0 (com Redis)
*   **Painel Administrativo:** ActiveAdmin ~> 3.2.0

### Banco de Dados & Armazenamento
*   **Banco Principal:** PostgreSQL (usando a gem `pg` no ambiente de produção e staging)
*   **Banco Local/Testes:** SQLite3 v1.4 (para agilidade no ambiente de desenvolvimento local e execução de suíte de testes)
*   **Armazenamento de Arquivos:** Active Storage (configurado em [config/storage.yml](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/config/storage.yml)) com suporte local e S3/DigitalOcean Spaces (`aws-sdk-s3`)
*   **Processamento de Imagens:** `image_processing` ~> 1.2 (usando libvips/imagemagick para redimensionamento automático de banners e logos)

### Autenticação & Autorização
*   **Autenticação de Usuários:** Devise + Devise Two-Factor v5.0 (autenticação de dois fatores por OTP)
*   **Autenticação Social:** OmniAuth (Google, LinkedIn e Facebook)
*   **Autorização e Controle de Acesso:** Pundit

---

## 🛠️ Infraestrutura e Utilitários de Build
*   **Docker:** Mapeamento completo com `Dockerfile`, `Dockerfile.frontend`, `Dockerfile.backend` e `docker-compose.yml` para orquestração de containers locais.
*   **Qualidade e Linter:**
    *   **Frontend:** ESLint, Prettier, Knip (para detecção de código morto).
    *   **Backend:** RuboCop.
*   **CI/CD Hooks:** Husky para travar commits se a tipagem TypeScript ou testes de frontend quebrarem (`pre-commit` e `pre-push`).
