# Plano de migração

1. Expandir schema com `companies.primary_category_id` nullable, índice e FK reversível.
2. Deploy backend aditivo que lê/escreve campo explícito; legado sem dado fica `NULL`.
3. Empresa escolhe apenas categoria associada; admin corrige com trilha auditável (mecanismo a confirmar).
4. Não fazer backfill pela ordem N:N. Relatório de candidatos pode ser apenas diagnóstico, sem escrita.
5. Migrar API/clientes mantendo campos legados.
6. Remover aliases só após medir consumidores restantes.

Schema/volume de produção não consultados. Nenhuma migration executada.
