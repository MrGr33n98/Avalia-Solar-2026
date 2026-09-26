# Plano de Rollback — Spec 005

## 1. Gatilhos de Rollback
- Falhas de inicialização ou aumento de taxa de erro 500 no endpoint de empresas ou badges.
- Incompatibilidade de renderização de cards de empresa ou perfis no Next.js.
- Regressão nos algoritmos de TrustScore ou Posicionamento B2B.

---

## 2. Procedimento de Rollback de Código
1. Como o rollout adota a estratégia **Expand-and-Contract**, o backend preserva todos os campos e métodos legados (`verified`, `featured`, `sponsored`, `category_info`, `badges`).
2. Se o frontend apresentar instabilidade, pode ser revertido de forma totalmente independente para o commit anterior sem necessidade de rollback do banco de dados.

---

## 3. Procedimento de Rollback de Banco de Dados
Caso seja necessário reverter a migration de banco:
```bash
cd AB0-1-back
bundle exec rails db:rollback STEP=1
```
- A ação reverte `add_reference :companies, :primary_category`, removendo o índice, a chave estrangeira e a coluna `primary_category_id`.
- Nenhuma tabela legada (`categories`, `categories_companies`, `badges`, `company_badges`) é alterada ou danificada.
