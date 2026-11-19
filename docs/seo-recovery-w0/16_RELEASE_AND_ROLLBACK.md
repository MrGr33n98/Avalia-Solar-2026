# Release e rollback

Estado atual: READY FOR REVIEW somente após checks focados disponíveis; não executar merge/deploy automaticamente.

Publicação: CI verde → deploy staging → validar endpoints → produção com rollback da imagem anterior se healthcheck/SEO contract falhar.

Rollback de código: revert da PR. Não há migration nem alteração de dados nesta W0.
