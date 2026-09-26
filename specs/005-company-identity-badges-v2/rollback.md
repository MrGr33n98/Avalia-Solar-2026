# Rollback

Rollback de código: retornar clientes ao payload compatível; manter campos legados na janela de rollout.

Rollback de schema: migration `down` remove apenas `primary_category_id`, índice e FK. Se já houver escolhas capturadas, exportar/retê-las antes de remover. Não remover flags legadas nem badges existentes.

Procedimento precisa validação contra pipeline Docker/Compose de produção. Nenhum rollback foi executado.
