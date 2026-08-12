# Validação de Runtime da Fase 5.1 (PATCH A)

Este guia descreve os passos necessários para executar a validação do runtime e das suítes de testes associadas à política canônica de campos da empresa (`CompanyFieldPolicy`). 

> [!NOTE]
> Como as execuções de testes estão limitadas sob o ambiente de sandbox do agente, estes passos devem ser rodados manualmente pelo operador no host.

## 1. Pré-requisitos Esperados

- **Ruby**: Versão `3.2.2` (conforme especificado no arquivo `.ruby-version` do backend).
- **Bundler**: Versão `2.4.22` ou superior.
- **Docker**: Caso utilize containers, verifique se a stack de backend está saudável (`ab0-backend`).

---

## 2. Roteiro de Validação do Backend

### Passo 2.1 — Acessar o diretório do backend
```bash
cd AB0-1-back
```

### Passo 2.2 — Validar versões do runtime local ou no container
Se estiver rodando **localmente**:
```bash
ruby -v
bundle -v
```

Se estiver rodando via **Docker Compose**:
```bash
docker compose exec backend ruby -v
docker compose exec backend bundle -v
```

---

## 3. Execução dos Testes RSpec

### Passo 3.1 — Executar specs isoladas da política
Se estiver rodando **localmente**:
```bash
bundle exec rspec spec/services/company_field_policy_spec.rb
```

Se estiver rodando via **Docker Compose**:
```bash
docker compose exec backend bundle exec rspec spec/services/company_field_policy_spec.rb
```

**Resultado esperado**:
- Sucesso com 0 falhas e todas as asserções da política de campos validadas.

### Passo 3.2 — Executar testes de integração da política com o controller
Se estiver rodando **localmente**:
```bash
bundle exec rspec spec/requests/api/v1/company_dashboard_policy_integration_spec.rb
```

Se estiver rodando via **Docker Compose**:
```bash
docker compose exec backend bundle exec rspec spec/requests/api/v1/company_dashboard_policy_integration_spec.rb
```

**Resultado esperado**:
- Sucesso com 0 falhas nos fluxos de update_info, update_logo e pendências.

### Passo 3.3 — Executar testes de integração correlatos
Se estiver rodando **localmente**:
```bash
bundle exec rspec spec/requests/api/v1/company_feature_access_spec.rb
```

Se estiver rodando via **Docker Compose**:
```bash
docker compose exec backend bundle exec rspec spec/requests/api/v1/company_feature_access_spec.rb
```

**Resultado esperado**:
- Execução limpa sem quebrar a autorização ou o payload de feature access.

### Passo 3.4 — Executar testes do CompanyHealthService
Se estiver rodando **localmente**:
```bash
bundle exec rspec spec/services/company_health_service_spec.rb
```

Se estiver rodando via **Docker Compose**:
```bash
docker compose exec backend bundle exec rspec spec/services/company_health_service_spec.rb
```

**Resultado esperado**:
- Sucesso com 0 falhas na nova lógica de explicabilidade e versionamento do Health.

### Passo 3.5 — Executar suíte completa de RSpec (Sanity Check)
Se estiver rodando **localmente**:
```bash
bundle exec rspec
```

Se estiver rodando via **Docker Compose**:
```bash
docker compose exec backend bundle exec rspec
```

---

## 4. Validação Estática do Frontend

### Passo 4.1 — Acessar o diretório do frontend
```bash
cd ../AB0-1-front
```

### Passo 4.2 — Executar linting e typecheck
```bash
npm run typecheck
npm run lint
```

**Resultado esperado**:
- `exit code 0` sem erros de tipagem no TypeScript ou avisos impeditivos no ESLint.

---

## 5. Procedimento de Rollback em Caso de Falha

Caso ocorra alguma falha na inicialização do Rails ou na suíte de testes de regressão após a aplicação das alterações, execute o procedimento abaixo para retornar ao estado original de forma segura:

### Passo 5.1 — Desfazer alterações no backend
Na raiz do repositório:
```bash
git checkout HEAD -- AB0-1-back/app/services/company_field_policy.rb
git clean -fd AB0-1-back/spec/services/company_field_policy_spec.rb
```

### Passo 5.2 — Reiniciar containers (se aplicável)
```bash
docker compose down && docker compose up -d
```
