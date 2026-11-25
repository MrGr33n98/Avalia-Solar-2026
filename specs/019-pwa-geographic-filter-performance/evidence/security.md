# Revisão de segurança do cache geográfico

- Endpoint geográfico só pode ser cacheado publicamente para GET anônimo e UF válida; cookies, autorização, payload de erro, respostas privadas e `Set-Cookie` não devem ganhar diretivas públicas.
- Proxy Next aplica allowlist de path/query; o navegador envia credenciais apenas conforme o contrato existente, sem torná-las elegíveis ao cache público.
- Service worker guarda apenas resposta 200 JSON explicitamente pública e validada; 4xx/5xx e cache miss offline não viram resposta positiva armazenada. Caches externos ao namespace Avalia são preservados na ativação.
- Nenhuma chave, token ou credencial foi incluída nos relatórios; as chaves usadas para Next dev eram locais descartáveis. Nenhuma chave de produção foi lida ou alterada.
- Não houve migration, escrita em banco de produção, alteração de ACL, flag global ou deploy.

Limite: a revisão automatizada cobre os cenários locais implementados, mas faltam variações completas de encoding/origin/status, auditoria de browser real, inspeção de headers no CDN e validação completa do contrato de isolamento de cache em staging. Ver `cache-http-cdn.md` e tasks T030–T035.
