# Migration and Data Safety Guide — Proposal Settings

**Versão:** 1.0.0  
**Data:** 14 de Outubro de 2026  
**Repositório:** `MrGr33n98/Avalia-Solar-2026`  

---

## 1. Princípios de Segurança de Dados
1. **Aditividade e Reversibilidade:**
   - A migration `20261014120000_create_company_proposal_settings.rb` é estritamente aditiva (`create_table`).
   - Reversível via `rails db:rollback` sem impacto em tabelas pré-existentes.
2. **Zero Quebra de Propostas Existentes:**
   - Propostas publicadas no passado utilizam os atributos congelados em `MarketplaceProposalVersion.terms` e attachments do ActiveStorage.
   - Nenhuma proposta enviada ao comprador sofre alteração retrospectiva quando as preferências corporativas são atualizadas.
3. **Isolamento de Tenant:**
   - Todo acesso no controller valida `current_user` e autorização Pundit para o `company_id`.
   - Chave única no banco (`add_index :company_proposal_settings, :company_id, unique: true`) impede duplicidades e concorrência desordenada.
4. **Política de Transição do `localStorage`:**
   - Preferências legadas no browser nunca são consideradas fonte de verdade.
   - No primeiro acesso de uma empresa, o backend inicializa valores padrão neutros e oficiais (`proposal_setting_or_default`).

---

## 2. Script de Verificação Pré-Deploy

```bash
# No diretório AB0-1-back
bundle exec rails db:migrate:status | grep proposal_settings
```

A migration deve ser aplicada uma única vez no pipeline de CI/CD antes da inicialização dos novos containers de produção.
