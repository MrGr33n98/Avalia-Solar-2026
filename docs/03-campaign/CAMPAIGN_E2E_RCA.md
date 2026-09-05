# Causas raiz verificadas

1. CAM-101/102/103/104: rotas estáticas ausentes. `[id]` converte `audiences` em `NaN`; `if (!campaignId) return` ocorre antes de `.finally`, mantendo loading. Confirmado por inspeção, reprodução no browser pendente.
2. Template settings substitui falha e lista vazia por registros fictícios com IDs 1 e 2. Salvamento em erro altera apenas estado local e limpa formulário, simulando persistência.
3. Preflight recebe hash de AudienceResolver e usa `empty?`/`size` como se recebesse coleção de contatos. Público vazio não bloqueia corretamente.
4. Dispatcher permite continuar quando Redis falha. Job agora reutiliza EmailMessage associado em retry e ignora recipient já enviado; teste de integração ainda pendente.
5. Provider summary declara configured incondicionalmente. Não constitui evidência de configuração nem entrega.

RSC NetworkError: ainda sem reprodução ou logs suficientes para atribuir causa.

6. Validação runtime local bloqueada: container frontend retorna HTTP 500 por `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` ausente; erro ocorre em `app/login/page.js`, antes de carregar workspace.

7. Stack campaign-cert não subiu nesta execução: imagem de backend/frontend exige build/pull, e Docker não deixou containers persistentes para inspeção.

8. Assinaturas de e-mail também tinham fallback fictício e salvamento local após erro; UI agora falha explicitamente e só mostra dados persistidos.

9. Envio manual usava fallback inseguro `current_user.company_id || 1`; removido. Sem tenant, envio retorna `COMPANY_REQUIRED`. Suppression checker agora compara e-mail com `LOWER`.
