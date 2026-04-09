# Branch Strategy — Avalia Solar

> Guia de trabalho com git para o time. Leia antes de abrir qualquer branch.

## Estrutura de Branches

```
feat/minha-feature
        │
        ▼
    develop  ──────────────────────────────────────┐
        │                                          │
        ▼                                          │
    staging  (homologação — cliente valida aqui)   │
        │                                          │
        ▼                                          │
      main   (produção — deploy automático)        │
        │                                          │
    hotfix/* ──────────────────────────────────────┘
```

## Branches Permanentes

| Branch | URL | Deploy | Proteção |
|--------|-----|--------|----------|
| `main` | `avaliasolar.com.br` | Auto no merge via PR | **1 approval + CI obrigatório** |
| `staging` | `staging.avaliasolar.com.br` | Auto no push | CI obrigatório |
| `develop` | local / dev server | Manual | Aberto |

## Fluxo de Trabalho

### Feature nova
```bash
# 1. Criar branch a partir do develop
git checkout develop
git pull origin develop
git checkout -b feat/nome-da-feature

# 2. Desenvolver e commitar
git add .
git commit -m "feat: descrição da feature"

# 3. Abrir PR para develop
gh pr create --base develop --title "feat: nome-da-feature"

# 4. Após review e merge em develop → abrir PR develop → staging
# 5. Cliente valida em staging
# 6. Abrir PR staging → main para ir para produção
```

### Hotfix urgente (bug em produção)
```bash
# Criar direto do main
git checkout main
git pull origin main
git checkout -b hotfix/descricao-do-bug

# Fix, commit, PR direto para main
gh pr create --base main --title "fix: descrição do bug"

# Após merge em main, mergear também em staging e develop:
git checkout staging && git merge main && git push origin staging
git checkout develop && git merge main && git push origin develop
```

## Convenção de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org):

| Prefixo | Quando usar |
|---------|-------------|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `perf:` | Melhoria de performance |
| `test:` | Adição/alteração de testes |
| `docs:` | Documentação apenas |
| `chore:` | Manutenção (deps, config, ci) |
| `refactor:` | Refatoração sem mudança de comportamento |

**Exemplo:** `feat: adicionar filtro por estado nas empresas [Story 3.2]`

## Regras de Branch Protection

### `main`
- ❌ Push direto **bloqueado** (todos, incluindo admin recebe aviso)
- ✅ PR obrigatório com **1 aprovação** mínima
- ✅ CI deve passar: `lint + test + build`
- ✅ Reviews stale são descartados ao atualizar o PR
- ❌ Force push proibido
- ❌ Deletar branch proibido

### `staging`
- ✅ Push direto permitido (para atualização rápida)
- ✅ CI deve passar antes do merge
- ❌ Force push proibido

## Dependabot

PRs automáticos de atualização de dependências chegam pela branch `dependabot/*`.
- Revisar semanalmente
- Mergear para `develop` primeiro, testar, depois promover

## Checklist antes de abrir PR para `main`

- [ ] CI verde (lint + test + build)
- [ ] Feature testada em `staging` primeiro
- [ ] Cliente / líder validou em staging (para features visíveis ao usuário)
- [ ] Story marcada como "Done" ou "Ready for Review"
- [ ] Sem `console.log` desnecessários
- [ ] Sem credenciais ou secrets hardcoded

---

*Última atualização: 2026-04-09 — @devops (Gage)*
