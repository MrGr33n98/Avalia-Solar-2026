# Plano de rollback

Não houve publicação, migration ou deploy. A mudança está em branch local sem commit; neste estágio, descarte apenas a branch/patch de Spec 019 após preservar ou exportar alterações que devam ser mantidas. Não usar `git reset --hard` ou limpeza global.

Para um release futuro:

1. Reverter o commit da aplicação e publicar a imagem anterior do frontend/backend pelo workflow de produção existente, após confirmar o SHA e a saúde dos serviços.
2. Não há mudança de schema para reverter. O aquecimento do catálogo é interno ao processo Rails; backend anterior remove a inicialização nova junto com o deploy.
3. O service worker desta branch incrementa sua versão e mantém um namespace geográfico próprio. Em rollback, publicar um SW compatível que expire/ignore esse namespace de forma segura. Não restaurar um worker antigo sem revisar sua rotina de ativação, pois uma rotina ampla pode remover caches da aplicação.
4. Não limpar caches de terceiros nem executar purge global. Se houver CDN configurada no futuro, purgar somente as chaves públicas de estados/cidades após verificar o comportamento do cache.
5. Fazer smoke não destrutivo de `/`, `/companies`, filtros e APIs geográficas; acompanhar erros e latência antes de encerrar rollback.

Este plano é documental; nenhum rollback foi ensaiado ou executado.
