# Plano de rollback — proposta

1. Antes do deploy, registrar SHA/artefato estável e instruções oficiais de rollback do pipeline existente; confirmar que a alteração não exige migração.
2. Isolar ativação da variante compacta na busca. Se houver mecanismo de feature flag já existente e apropriado, utilizá-lo; caso contrário, não criar infraestrutura nova apenas para o layout.
3. Gatilhos: regressão de favoritos/navegação/filtros, condição comercial incorreta, overflow crítico, regressão grave de performance ou falha de build/smoke.
4. Desabilitar variante quando houver flag; caso contrário, reverter commit/PR conforme processo da equipe e redeploy do artefato estável. Não executar reset destrutivo de branch compartilhada.
5. Verificar busca, catálogo, favoritos e analytics após rollback; registrar versão e incidentes.
6. Reabrir wave correspondente com teste de reprodução.

Não foi executado rollback nesta auditoria; validar procedimento real na W9.
