# Testes Automatizados - Avalia Solar

Este documento detalha a estratégia de garantia de qualidade, frameworks de testes, organização da suíte de testes e os processos de execução tanto no Frontend quanto no Backend do ecossistema **Avalia Solar**.

---

## 💻 Testes de Frontend (`AB0-1-front`)

O frontend possui três níveis complementares de testes para cobrir interações visuais, comportamentos complexos e fluxos ponta a ponta:

### 1. Testes Unitários e Integração (Jest & React Testing Library)
*   **Finalidade:** Validar a renderização correta de componentes isolados, lógica de formulários (Zod + React Hook Form) e o comportamento de hooks customizados.
*   **Configurações:** [jest.config.js](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/jest.config.js) e [jest.setup.js](file:///c:/Users/Bobi/Desktop/AB0-1-front/jest.setup.js).
*   **Localização:** Na pasta [__tests__/](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/__tests__/) ou arquivos `.test.tsx` ao lado dos componentes.
*   **Comando para Executar:**
    ```bash
    npm run test
    ```
    *   Comando para cobertura de testes: `npm run test:coverage`.

### 2. Testes Ponta a Ponta (Playwright E2E)
*   **Finalidade:** Simular cenários reais de ponta a ponta em navegadores de verdade (Chromium, Firefox, WebKit). Isso cobre fluxos críticos de negócios como: jornada do lead, fluxo de checkout, navegação responsiva e visualização de banners.
*   **Configurações:** [playwright.config.ts](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/playwright.config.ts).
*   **Comando para Executar:**
    ```bash
    npx playwright test
    ```
*   **Relatórios:** O Playwright gera relatórios visuais interativos na pasta `playwright-report/` após a conclusão das execuções de validação.

---

## ⚙️ Testes de Backend (`AB0-1-back`)

O backend Rails foca em testes de alta fidelidade das APIs, segurança e integridade do banco de dados utilizando a suíte RSpec.

### 1. RSpec (`rspec-rails`)
*   **Finalidade:** Validar regras de negócio no banco, jobs assíncronos e testar exaustivamente as respostas JSON de cada endpoint da API REST v1.
*   **Localização dos Arquivos (pasta `spec/`):**
    *   **Models (`spec/models/`):** Validações, escopos e métodos de entidades (ex: `spec/models/company_spec.rb`).
    *   **Requests (`spec/requests/`):** Chamadas HTTP diretas contra os controllers da API para validar retornos, cabeçalhos, códigos HTTP e payloads formatados pelos serializadores.
    *   **Jobs (`spec/jobs/`):** Garante que os workers do Sidekiq enfileiram e executam suas rotinas sem falhar (ex: processamento de Webhooks, e-mails).

### 2. Fábricas de Teste (FactoryBot)
*   **Finalidade:** Substitui Fixtures estáticas por fábricas flexíveis (`factory_bot_rails` e `faker` gems) que geram dados dinâmicos, realistas e válidos para cada cenário de teste sem poluir as migrações de banco locais.

### 3. Cobertura de Código (SimpleCov)
*   **Finalidade:** Analisa a cobertura de testes no backend Rails.
*   **Tecnologia:** `simplecov` e `simplecov-console` gems integradas no topo do arquivo `spec/spec_helper.rb`. Toda vez que o RSpec roda por completo, um relatório de cobertura é cuspido no terminal e salvo como HTML interativo.
*   **Comando para Executar Testes:**
    ```bash
    bundle exec rspec
    ```
