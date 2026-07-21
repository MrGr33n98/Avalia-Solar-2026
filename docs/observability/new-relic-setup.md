# New Relic Browser — setup e operação

## Estado da implementação

| Tarefa | Estado | Evidência |
| --- | --- | --- |
| 1. Criar aplicação Browser | Concluída | Aplicação e snippet confirmados em 2026-07-21 |
| 1. Documentar setup e identificadores | Concluída | Este documento |
| 2. Variáveis de ambiente | Concluída | `AB0-1-front/.env.example` |
| 3. Componente Browser | Concluída | Componente isolado e testes unitários |
| 4. Integração no layout | Concluída | `AB0-1-front/app/layout.tsx` |
| 5. CSP | Concluída | Origens exatas, teste automatizado e header local conferido |
| 6. Staging | Em andamento | Pipeline preparado; aguarda variáveis e deploy |
| 7–11 | Não iniciadas | Executar sequencialmente após os gates de cada tarefa |

> Não versionar o snippet real nem qualquer identificador real. Mesmo que a Browser
> License Key seja destinada ao navegador, os valores devem ser administrados nas
> configurações de cada ambiente e não neste repositório.

## Decisões de arquitetura

- Método de instalação: **copy/paste JavaScript** da aplicação Browser.
- Primeira ativação: **staging**.
- Produção: criar/configurar entidade separada ou configuração explicitamente
  identificada como produção antes do rollout.
- Session Replay do New Relic: **desativado**.
- O New Relic não substituirá inicialmente Web Vitals, Sentry, PostHog ou GA4.
- O snippet não será colocado diretamente no layout. A integração futura será feita
  por um componente isolado, condicionado a ambiente, feature flag e consentimento.

## Tarefa 1 — criar a aplicação Browser

Esta etapa exige uma sessão autenticada na conta New Relic e deve ser executada por
um administrador da conta.

1. Acesse [one.newrelic.com](https://one.newrelic.com/).
2. Abra **Integrations & Agents** (ou **Add data**, conforme a navegação exibida).
3. Selecione **Browser monitoring**.
4. Escolha o método **Copy/Paste JavaScript code**.
5. Use um nome inequívoco para a primeira entidade, por exemplo:
   `Avalia Solar Web - Staging`.
6. Informe o domínio de staging, quando solicitado.
7. Finalize o assistente até a tela que apresenta o snippet JavaScript completo.
8. Copie o snippet para o gerenciador de secrets aprovado. Não cole o valor em issue,
   chat, commit, documentação ou arquivo `.env` versionado.
9. Em **Browser > Settings > Application settings**, confirme que o monitoramento está
   habilitado e mantenha **Session Replay desativado**.
10. Restrinja/monitore os domínios autorizados para a Browser License Key quando essa
    opção estiver disponível na conta.

Referências oficiais:

- [Browser license key and app ID](https://docs.newrelic.com/docs/browser/browser-monitoring/configuration/browser-license-key-app-id/)
- [Troubleshoot browser monitoring installation](https://docs.newrelic.com/docs/browser/browser-monitoring/troubleshooting/troubleshoot-your-browser-monitoring-installation/)
- [Disable browser monitoring](https://docs.newrelic.com/docs/browser/new-relic-browser/installation/disable-browser-monitoring/)

## Inventário do snippet (sem valores reais)

Registre os valores reais somente no gerenciador de secrets do ambiente. Este quadro
serve para conferir se todos os identificadores foram localizados no snippet oficial.

| Identificador | Placeholder documental | Onde localizar |
| --- | --- | --- |
| Account ID | `<NEW_RELIC_ACCOUNT_ID>` | Conta/metadata ou configuração do snippet |
| Application ID | `<NEW_RELIC_APPLICATION_ID>` | `applicationID` em `NREUM.info` |
| Browser License Key | `<NEW_RELIC_BROWSER_LICENSE_KEY>` | `licenseKey` em `NREUM.info` |
| Trust Key | `<NEW_RELIC_TRUST_KEY>` | `trustKey` na configuração gerada, quando presente |
| Agent ID | `<NEW_RELIC_AGENT_ID>` | Metadata/configuração gerada, quando presente |
| Beacon | `<NEW_RELIC_BEACON_HOST>` | `beacon` em `NREUM.info` |
| Error beacon | `<NEW_RELIC_ERROR_BEACON_HOST>` | `errorBeacon` em `NREUM.info` |
| Agent loader host | `<NEW_RELIC_SCRIPT_HOST>` | URL/host utilizado pelo loader oficial |

Não sintetize Trust Key ou Agent ID se a versão atual do snippet não os apresentar.
Nesse caso, registre no inventário operacional como `não fornecido pelo snippet atual`.

## Checklist de aceite da Tarefa 1

- [x] Aplicação Browser criada na conta New Relic.
- [x] Método copy/paste selecionado e snippet oficial gerado.
- [x] Account ID identificado.
- [x] Application ID identificado.
- [x] Browser License Key identificada.
- [x] Trust Key identificado ou ausência documentada conforme o snippet atual.
- [x] Agent ID identificado ou ausência documentada conforme o snippet atual.
- [x] Hosts de loader, beacon e error beacon disponíveis no snippet para a futura CSP.
- [x] Snippet real armazenado fora do Git.
- [x] Consentimento nativo do Browser Agent ativado.
- [x] Session Replay do New Relic confirmado como desativado.
- [x] Data da configuração registrada: 2026-07-21.

## Evidência necessária para desbloquear a Tarefa 2

O responsável deve confirmar, sem enviar valores secretos:

```text
Aplicação Browser criada: sim
Nome da aplicação: Avalia Solar Web - Staging
Snippet oficial gerado: sim
Identificadores inventariados: sim
Hosts do snippet inventariados: sim
Session Replay New Relic: desativado
Valores armazenados no gerenciador de secrets: sim
```

Não envie o snippet ou as chaves em capturas de tela, mensagens ou pull requests.

## Tarefa 2 — variáveis de ambiente

As variáveis públicas do Browser Agent estão declaradas, vazias e desativadas por
padrão em `AB0-1-front/.env.example`:

```text
NEXT_PUBLIC_NEW_RELIC_BROWSER_ENABLED=false
NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID=
NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID=
NEXT_PUBLIC_NEW_RELIC_BROWSER_LICENSE_KEY=
NEXT_PUBLIC_NEW_RELIC_TRUST_KEY=
NEXT_PUBLIC_NEW_RELIC_AGENT_ID=
NEXT_PUBLIC_NEW_RELIC_ENVIRONMENT=
NEXT_PUBLIC_NEW_RELIC_RELEASE=
```

O backend Rails usa exclusivamente `NEW_RELIC_LICENSE_KEY` em
`AB0-1-back/config/newrelic.yml`. Essa é a licença privada do APM e nunca deve ser
copiada para uma variável `NEXT_PUBLIC_*`, imagem Docker pública ou bundle Next.js.

### Configuração por ambiente

- **Desenvolvimento:** copiar `AB0-1-front/.env.example` para `.env.local`; manter
  `NEXT_PUBLIC_NEW_RELIC_BROWSER_ENABLED=false` e os identificadores vazios.
- **Staging:** cadastrar os valores na configuração protegida do serviço de deploy ou
  nos GitHub Environment Secrets de `staging`. Definir environment como `staging` e
  habilitar somente durante a validação da Tarefa 6.
- **Produção:** cadastrar valores no gerenciador de secrets/configuração do runtime de
  produção. Definir environment como `production`; manter a flag `false` até o rollout
  gradual da Tarefa 9.

Variáveis `NEXT_PUBLIC_*` são incorporadas ao bundle do navegador durante o build e,
portanto, não devem conter a licença privada do APM, tokens administrativos ou PII.
Os identificadores do Browser Agent são separados da credencial APM do Rails.

## Tarefa 3 — componente Browser

O componente `components/observability/NewRelicBrowser.tsx`:

- existe apenas no cliente e somente ativa em produção com feature flag explícita;
- aguarda consentimento de analytics antes de solicitar o loader oficial;
- carrega o agente SPA com estratégia `afterInteractive`;
- usa estado global idempotente para impedir carregamentos duplicados;
- chama `newrelic.consent(false)` e remove o identificador ao revogar;
- não reinicia no mesmo ciclo de página depois da revogação;
- mantém Session Replay desativado no código e no painel;
- desabilita cookies do agente e captura de payloads AJAX;
- envia apenas environment, release e ID interno pseudonimizado com SHA-256;
- não envia atributos de nome, e-mail, telefone, avaliação ou lead.

O New Relic Browser usa sua própria instrumentação nativa. Nenhuma métrica é enviada
manualmente a ele pelo `WebVitalsReporter`.

## Tarefa 4 — integração no layout

`NewRelicBrowser` é renderizado como componente isolado em `app/layout.tsx`, dentro de
`Providers`. Assim ele tem acesso ao contexto autenticado sem modificar a ordem ou a
configuração de Sentry, PostHog, GA4 e Web Vitals. A integração não adiciona provider,
listener de rota nem envio manual de Core Web Vitals.

## Tarefa 5 — Content Security Policy

A CSP permite somente os hosts exigidos pelo snippet atualmente inventariado:

- `script-src`: `https://js-agent.newrelic.com`, para o loader oficial;
- `connect-src`: `https://bam.nr-data.net`, para beacons e erros.

O snippet atual não exige uma origem New Relic em `img-src`, portanto nenhuma foi
adicionada. Não foram introduzidos curingas de domínio. As permissões amplas que já
existiam em outras diretivas são passivo anterior e não foram ampliadas nesta tarefa.
Um teste automatizado protege a presença das origens exatas e a ausência de curingas
New Relic.

Validação local em 2026-07-21: 9 testes direcionados, lint direcionado,
typecheck e build aprovados. O header servido pelo Next.js foi inspecionado e contém
as duas origens nas diretivas corretas. A página local respondeu 500 por ausência da
variável preexistente `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`; isso não alterou a
validação do header. A inspeção do console com credenciais reais será repetida em
staging como gate da Tarefa 6.

## Tarefa 6 — validação em staging

O `Dockerfile.frontend` aceita os identificadores públicos do Browser Agent como
build args, pois variáveis `NEXT_PUBLIC_*` precisam existir no momento do build do
Next.js. O workflow de staging habilita o agente, fixa `environment=staging` e usa o
SHA do commit como release.

Antes do deploy, cadastre estas **GitHub Actions repository variables** sem registrar
os valores em arquivos ou logs:

```text
STAGING_NEW_RELIC_ACCOUNT_ID
STAGING_NEW_RELIC_APPLICATION_ID
STAGING_NEW_RELIC_BROWSER_LICENSE_KEY
STAGING_NEW_RELIC_TRUST_KEY
STAGING_NEW_RELIC_AGENT_ID
```

Os valores são identificadores do agente Browser e inevitavelmente ficam visíveis no
bundle entregue ao navegador; eles nunca devem ser confundidos com
`NEW_RELIC_LICENSE_KEY`, a licença privada do APM Rails.

Após o deploy, validar em uma janela limpa:

1. recusar analytics e confirmar ausência de requests para `js-agent.newrelic.com` e
   `bam.nr-data.net`;
2. aceitar analytics e confirmar um único carregamento do loader e beacons;
3. conferir Console sem violação CSP;
4. revogar analytics e confirmar que novos beacons param;
5. navegar pelas rotas públicas, login e cadastro;
6. confirmar sessões, Web Vitals e erros JS na entidade Browser de staging;
7. manter Session Replay desativado.
