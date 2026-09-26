# Tracking semantics

| Tipo | Fonte canônica | Significado comercial |
|---|---|---|
| delivery/delay/bounce/complaint/reject | Evento SNS verificado | Estado reportado pelo SES; manter raw envelope mínimo e idempotência SNS |
| open_signal | Pixel Avalia | Imagem de tracking requisitada; não prova leitura humana |
| click | Redirect Avalia | Link rastreado requisitado; scanner pode gerar acesso |
| reply | Inbound adapter autenticado | Email recebido e associado a thread/contato |

SNS open/click, se recebidos, ficam como raw provider telemetry e não incrementam métricas comerciais canônicas. Classificação é regra determinística versionada, com reasons allowlisted; evidência insuficiente vira `unknown`. Contagem raw conta requests persistidos; unique segue chave dedupe versionada, sem identificar pessoas por IP cru. `human_likely` nunca deve ser rotulado como certeza.

`delivery_status` não é sobrescrito por engagement. `engagement_status` é monotônico por prioridade aprovada (reply > click > open_signal > none), enquanto lifecycle conserva timestamps e eventos fora de ordem.
