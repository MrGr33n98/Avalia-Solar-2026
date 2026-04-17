# Avalia Solar 2026

Plataforma avançada para avaliação e consultoria de energia solar. Este repositório é estruturado como um monorepo profissional, integrando um ecossistema completo de backend, frontend e infraestrutura.

## 🚀 Visão Geral e Arquitetura

O projeto "Avalia Solar 2026" foi projetado para ser escalável e de fácil manutenção, separando as responsabilidades em serviços distintos:

- **Backend (`AB0-1-back`)**: API robusta em **Ruby on Rails 7**. Utiliza PostgreSQL para persistência de dados e Redis/Sidekiq para processamento de tarefas em segundo plano.
- **Frontend (`AB0-1-front`)**: Interface moderna em **Next.js 14** (React 18), focada em performance e experiência do usuário (UX), seguindo princípios **PWA-first**.
- **Infraestrutura**: Orquestração completa via **Docker Compose** e pipelines de CI/CD automatizados para deploy na **DigitalOcean**.

---

## 📂 Estrutura do Repositório

A raiz foi organizada de forma limpa para facilitar o onboarding de novos desenvolvedores:

- `AB0-1-back/`: Código fonte da API Rails.
- `AB0-1-front/`: Código fonte do frontend Next.js.
- `docs/`: Documentação técnica detalhada, guias de design e estratégias de marketing.
- `infra/`: Arquivos de configuração de infraestrutura (Dockerfile, Nginx, etc.).
- `scripts/`: Scripts utilitários para diagnóstico, automação e deploy.
- `marketing/`: Ativos de marketing e páginas de destino HTML.
- `archive/`: Arquivos legados e redundantes preservados por histórico.

---

## 🛠️ Onboarding: Primeiros Passos

### Pré-requisitos
- Docker e Docker Compose instalados.

### Rodando o Projeto Localmente
A partir da raiz do repositório:

1. **Subir os containers:**
   ```bash
   docker compose up -d
   ```

2. **Preparar o Banco de Dados (Backend):**
   ```bash
   docker compose exec backend bundle exec rails db:migrate
   ```

3. **Acessar as Aplicações:**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## 📊 Regras de Negócio e Guidelines

### Orçamentos (Recurso Pago)
- O fluxo de orçamentos e botões de contato só aparecem se a empresa tiver `active_admin = true` no banco de dados.
- O gate de revisão bloqueia leads para empresas inativas.

### Mobile Development
- A estratégia oficial é **PWA-first**.
- Consulte `docs/architecture/MADR-001-mobile-platform.md` para decisões arquiteturais mobile.
- **Safe-area**: Todos os elementos fixos devem respeitar as margens de segurança do dispositivo.

---

## 🚢 CI/CD & Deploy

O deploy é automatizado via GitHub Actions na DigitalOcean.
- **Workflow Principal:** `.github/workflows/deploy-v1.yml`.
- **Ambientes:** Deploy automático para produção ao realizar push na branch `main`.

---

## 📖 Mais Documentação
Para guias específicos de design (Claymorphism), auditorias técnicas ou manuais de segurança, explore a pasta [`docs/`](./docs/):
- [Introdução à Documentação](./docs/00_LEIA-ME_PRIMEIRO.md)
- [Guia de Safe-Area](./docs/guides/safe-area-guide.md)

---
*Para o histórico do tutorial original (Noticed v2), consulte [`docs/archive/blog_tutorial.md`](./docs/archive/blog_tutorial.md).*
