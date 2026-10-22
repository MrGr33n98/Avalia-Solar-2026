# 10 — Segurança, LGPD, Autorização & Governança de IA

## 1. Princípios de Proteção de Dados (LGPD) no CRM

1. **Finalidade Estrita (Purpose Limitation):** Contatos de consumidores originados no marketplace para orçamentos de energia solar possuem consentimento específico para atendimento por integradores. É expressamente proibido transferir ou converter esses contatos em leads para vendas comerciais de planos SaaS sem consentimento específico.
2. **Minimização de Dados (Data Minimization):** Registros de telemetria (PostHog, Sentry) não recebem nomes, CPFs, telefones, transcrições de áudio ou conteúdos de e-mail.
3. **Isolamento de Tenants (Multi-Tenancy):** Consultas ao banco de dados são escopadas pelo tenant do usuário logado via `Sales::TenantScope`. Tentativas de acesso a IDs de contas pertencentes a outros tenants resultam em `404 Not Found` para evitar enumeração de recursos (IDOR).

---

## 2. Controle de Acesso Baseado em Funções (RBAC)

O backend Rails implementa `Sales::AuthorizationService` com as seguintes permissões operacionais:
- `sales:read`: Visualização de contas, contatos, fila do dia e relatórios agregados.
- `sales:write`: Criação e edição de contas, contatos, tarefas e atividades.
- `sales:deals`: Movimentação de estágios no Kanban e fechamento de negócios.
- `sales:quotes`: Emissão e cancelamento de propostas comerciais.
- `sales:admin`: Gestão de regras fiscais, permissões de equipe e chaves de API.

---

## 3. Governança de Recursos de IA e Voz

- **Revisão Humana Mandatória (Human-in-the-Loop):** Nenhum serviço de IA tem autorização para disparar e-mails, efetuar chamadas ou alterar estágios contratuais de forma autônoma. Todo texto extraído é apresentado como sugestão rascunho sujeita a confirmação explícita do vendedor.
- **Descarte de Áudio Bruto:** Arquivos de gravação não são retidos permanentemente. O processamento ocorre via buffer temporário com descarte imediato após a extração textual.
