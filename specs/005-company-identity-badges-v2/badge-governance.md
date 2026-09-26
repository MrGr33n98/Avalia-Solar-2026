# Governança de Badges & Reconhecimentos — Spec 005

## 1. Princípios de Autoridade e Mérito
1. **Origem Controlada:** Badges oficiais são criados e outorgados exclusivamente pela equipe Avalia Solar via ActiveAdmin. Nenhuma empresa cria ou edita seus próprios selos.
2. **Evidência Histórica Imutável:** Um selo outorgado referente a um ano/edição (ex: "Top Brand 2026", "Top 1 Florianópolis 2025") constitui um ativo histórico permanente da empresa. Variações posteriores no ranking em tempo real NÃO removem ou alteram retroativamente o selo conquistado.
3. **Reconhecimento != Plano Comercial:** Uma empresa do plano `free` que conquistou um selo legítimo mantém o selo visível em seu perfil.

---

## 2. Operação no ActiveAdmin (`app/admin/badges.rb`)
- **Acesso:** Reativar no menu administrativo sob o grupo **"Reconhecimentos & Autoridade"**.
- **Filtros Obrigatórios:** `active`, `year`, `edition`, `category_label`, `name`.
- **Atribuição M:N:** Seleção de empresas por interface segura com busca.
- **Rastreabilidade:** Atribuições e revogações devem gerar log de auditoria no Rails (`Rails.logger.info("[Badge Audit]...")` ou tabela de auditoria).

---

## 3. Painel B2B da Empresa (`BadgesManagement.tsx`)
- **Escopo:** Exclusivamente de consulta, download de arte oficial, cópia do link de verificação (`verifiable_url`) e obtenção de snippets HTML para embed em sites próprios.
- **Proibição:** Nenhum formulário de criação/edição de badges no painel B2B.
