# Auditoria de performance do CI/CD — 12/11/2026

## Escopo e método

Leitura dos 20 runs mais recentes na `main` de `ci-web-backend.yml` e
`cd-production.yml`, dos jobs/steps do commit `239fbe7a19555d24090e07ff015b691bb19b5116`
e dos workflows, scripts, Dockerfiles e Compose de produção/teste.
Os percentis usam nearest-rank. Fila = `run_started_at - created_at`; execução =
`updated_at - run_started_at`. Runs sem início não entram no cálculo da fila.

## Baseline medido

| Amostra | Estados nos 20 runs | Fila p50 / p95 / máximo | Execução p50 / p95 / máximo |
|---|---|---:|---:|
| CI | 18 falhas, 1 cancelado, 1 enfileirado | 0 / 0 / 0 min* | 7,23 / 61,65 / 61,65 min** |
| CD produção | 19 falhas, 1 enfileirado | 0 / 62,93 / 62,93 min* | 5,95 / 40,72 / 40,72 min*** |

\* Entre os 19 runs que iniciaram; o run enfileirado foi excluído.
\** O p95/max inclui um CI cancelado após 61,65 min; somente entre as 18 falhas,
p50 foi 7,03 min e p95/máximo 8,55 min.
\*** Todos os 19 runs concluídos da amostra falharam. Estes números são tempo de
execução de falhas/bloqueios, não duração de deploys bem-sucedidos. O tempo
criação-conclusão do CD foi p50 7,25 min e p95/máximo 69,43 min, incluindo fila.

Não há deploy bem-sucedido nessa janela; portanto não há baseline válido de
lead time de produção bem-sucedida.

### Execução de referência — SHA `239fbe7a`

- CI: 12:10:29–13:12:08 UTC; concluído como cancelado.
- E2E: inicialização do Compose 5,17 min; instalação dos browsers 0,98 min;
  execução Playwright 48,15 min antes do cancelamento.
- RSpec: job 4,37 min; etapa RSpec 3,72 min.
- CD: execução total 37,03 min. Frontend Docker build 5,47 min; backend build
  1,07 min; publicação de cada imagem levou poucos segundos.
- Job de deploy ficou 30,77 min no gate `Verify CI Status`, fazendo 90 consultas
  separadas por 20 s. SSH, migrations e atualização de containers não começaram.

## Dez gargalos e evidência

| # | Gargalo | Evidência | Impacto confirmado ou limite |
|---:|---|---|---|
| 1 | Playwright completo no fluxo síncrono | Step levou 48,15 min; E2E depende de todos os gates; job usa 1 worker | Principal bloqueio observado para release saudável |
| 2 | Quatro projetos repetem Chromium | Configuração tem Chromium desktop, mobile, tablet e desktop custom; não há projeto WebKit | Trabalho repetido; o delta real por projeto não foi medido |
| 3 | O E2E reconstrói a stack Compose | `up --build` consumiu 5,17 min; sem cache remoto explícito no job | Tempo medido; miss de cache entre runners é provável, mas não medido diretamente |
| 4 | Espera fixa no startup E2E | `sleep 15` após `compose up` | Espera desnecessária quando readiness já está disponível |
| 5 | Browser não usado é instalado | O CI instalava Chromium e WebKit; todos os projetos configurados usam Chromium | Instalação observada: 0,98 min; parcela do WebKit não isolada |
| 6 | Polling do CI no deploy | 90 × 20 s; execução atual terminou no teto de 30 min sem iniciar SSH | Causa direta do bloqueio do deploy atual |
| 7 | Imagens são compiladas antes da aprovação do CI | Jobs de imagem e gate de CI correm em paralelo no CD atual | Builds de SHA que falha podem consumir ~6 min sem possibilidade de deploy |
| 8 | Exportação de cache Docker não estava configurada no CD produção | `cache-from` presente, `cache-to` ausente no workflow de produção | É uma lacuna de configuração; taxa de cache hit anterior não foi registrada |
| 9 | Dependências são instaladas em runners/jobs separados | `npm ci` aparece em fast-feedback, gates frontend e E2E; cache de npm é configurado | Reinstalação lógica confirmada; duração por instalação não foi extraída nesta amostra |
| 10 | Espera de runner em parte dos deploys | Fila CD p95 e máximo 62,93 min | Fila é separada do tempo de execução e não é corrigida por acelerar builds |

Outros dados: 17/19 CD concluídos falharam em `Verify CI Status`; 2 falharam no
build frontend. No CI, 17/18 falhas concluídas foram em RSpec e uma em RuboCop;
o E2E cancelado é contabilizado separadamente.

### Proteções existentes que precisam de trabalho separado

O workflow atual marca RuboCop, Bundler Audit, Gitleaks, lint frontend e `npm audit`
como não bloqueantes (`continue-on-error` ou `|| true`). Esta otimização não altera
esse comportamento nem trata um aviso como uma aprovação de segurança. Endurecer
esses checks requer primeiro corrigir o baseline de findings e medir o impacto no
CI; fica registrado como follow-up de segurança.

## Caminho crítico

```mermaid
flowchart LR
  A[Push na main] --> B[CI: qualidade, segurança, RSpec e contratos]
  A --> C[Build backend e frontend]
  B --> D[Deploy consulta CI a cada 20 s]
  C --> D
  D -->|até 30 min| E[Deploy bloqueado se E2E não terminar]
  B --> F[E2E completo: até 48 min observados]
```

Na amostra histórica, Playwright e polling eram bloqueios dominantes. No run novo
da `main`, o Playwright crítico levou 24 s, mas o job E2E levou 12 min 32 s: o
setup/build da stack Compose consumiu 9 min 36 s. O custo principal medido passou
a ser o build Docker frio, não a execução Playwright.

## Otimizações preparadas na branch

- Push/PR: E2E crítico no Chromium para sessão, descoberta SEO/SSR, financiamento
  e acesso à jornada de propostas.
- Suíte Playwright completa: agendada diariamente às 04:00 UTC e disponível por
  `workflow_dispatch`; continua bloqueando essa execução completa.
- `docker compose up --wait` substitui `sleep 15` e instala somente Chromium,
  usado pelos projetos atuais.
- CD passa a reagir à conclusão do CI e verificar o `workflow_run` exato, SHA,
  evento `push`, branch `main` e ancestralidade do SHA. Build só começa depois do
  gate aprovado; release frontend-only é classificado e encaminhado ao workflow
  que atualiza apenas frontend.
- Deploy frontend manual falha rápido se o CI ainda não iniciou/concluiu; não faz
  polling prolongado.
- BuildKit passa a exportar cache GHA separado para backend e frontend.
- Grupo de concorrência de produção continua sem cancelamento; CI obsoleto mantém
  cancelamento seguro.

## Medição depois das mudanças

No CI do PR #99, run #837 (13/11/2026, SHA `04271ae5`), o workflow concluiu
com sucesso em **7 min 36 s**. A fila observada foi zero. Os jobs medidos foram:

| Etapa | Duração observada |
|---|---:|
| Qualidade e segurança / fast feedback | 2 min 22 s |
| RSpec seletivo (job) | 1 min 31 s |
| RSpec (21 exemplos, 0 falhas) | ~7 s |
| Contratos de ranking e categoria | 1 min 21 s cada, paralelos |
| E2E crítico (job completo) | 3 min 34 s |
| `docker compose up --wait` no E2E | 1 min 30 s |
| Instalação do Chromium | 49 s |
| Playwright crítico | 20 s |

O `docker compose up --wait` observado ficou 71% abaixo do setup de 5 min 10 s
na execução de referência cancelada. Esta comparação é apenas entre dois steps
de runs diferentes (um cancelado e outro bem-sucedido); runners, cache e carga
podem diferir. O CI de 7:36 não demonstra redução contra o p50 histórico de 7:03
das falhas: é um único run bem-sucedido e a comparação mistura resultados distintos.
O E2E crítico não existia como categoria separada antes; não há percentual “antes/depois”.

O run #837 veio antes das alterações backend-only descritas nesta revisão. Após
ele, a PR #99 foi merged às 04:07:47 UTC no SHA `04271ae5`; o CD automático da
`main` executou a atualização dos serviços:

- CI #43363470366: 18 min 15 s, fila praticamente zero. Fast feedback: 3 min 14 s;
  RSpec seletivo: job 1 min 18 s, etapa 37 s; E2E: job 12 min 32 s.
- Compose E2E: 9 min 36 s; Playwright crítico: 24 s; browser install: 58 s. Cache
  npm de ~227 MB restaurado. O log importou manifestos BuildKit, mas executou
  `npm ci`, `bundle install` e `npm run build`; essas camadas não foram reutilizadas.
- CD #43365505508: 16 min 53 s, fila praticamente zero. Builds paralelos: backend
  2 min 13 s, frontend 8 min 30 s; SSH remoto 4 min 43 s. Migrations, smoke tests
  e health checks internos passaram; backend, frontend e worker foram recriados e
  reportados saudáveis.
- A verificação pública falhou após 3 min 02 s: 12 tentativas de `www` retornaram
  HTTP 502. Em 04:45:44 UTC, `www` e `app` continuavam 502, enquanto
  `api/health/liveness` respondia 200. O workflow ficou vermelho depois de
  atualizar os containers; a falha de verificação pública não acionou rollback.
  A causa raiz do 502 ainda não foi confirmada.
- Do merge ao fim do CD com falha: 35 min 14 s. Não é lead time de release
  bem-sucedido. Nenhum diagnóstico SSH ou rollback manual foi executado nesta sessão.

Este CD prova que build e deploy remoto ocorreram, mas não confirma disponibilidade
pública; não deve ser contado como release bem-sucedido. A alteração backend-only
posterior ainda não foi validada remotamente nem implantada.

| Métrica | Antes observado | Depois observado | Melhoria comprovada |
|---|---:|---:|---:|
| CI | Falhas: p50 7,03 min; p95 8,55 min | PR: 7,60 min; push `main`: 18,25 min | Não comprovada; amostras diferentes |
| Playwright completo | 48,15 min até cancelamento | Pendente (execução agendada/manual) | Não comprovada |
| Playwright crítico | Não havia categoria separada | 20 s (PR); 24 s (`main`) | Sem baseline equivalente |
| Build frontend | 5,47 min | 8,50 min (CD) | +55%; runners/cache diferentes |
| Build backend | 1,07 min | 2,22 min (CD) | +108%; runners/cache diferentes |
| Publicação de imagens | Segundos por imagem no run de referência | Não isolado | Pendente |
| Deploy | Sem sucesso; polling 30,77 min | SSH 4,72 min; CD falhou na validação pública após 16,88 min | Release público não confirmado |
| Tempo total até produção | Sem deploy bem-sucedido na amostra | 35,23 min até a validação falha | Não é release bem-sucedido |
| Lead time de produção | Sem deploy bem-sucedido na amostra | Sem confirmação pública | Pendente |

Fluxo-alvo após as alterações atuais:

```mermaid
flowchart LR
  A[CI termina para SHA exato na main] --> B[workflow_run valida SHA e escopo]
  B --> C{Escopo}
  C -->|frontend-only| D[Build frontend e atualiza só frontend]
  C -->|backend-only| E[Build backend; migrations; backend e worker]
  C -->|full| F[Build backend + frontend em paralelo]
  F --> G[Migrations, serviços e smoke tests]
  D --> H[Health check e rollback]
  E --> H
  G --> H
```

## Riscos e validação

- O subset crítico foi selecionado para as jornadas de sessão, descoberta, quote
  de financiamento e propostas. A suíte completa permanece no agendamento/manual;
  o primeiro run real deve confirmar se o subset cabe no orçamento de CI.
- Mudanças em configuração de workflow só podem ser validadas por um run real do
  GitHub Actions. Este documento não considera parse YAML ou testes locais como
  prova de deploy.
- O gate falha fechado quando o CI associado está ausente, incompleto, pertence a
  outro SHA/branch ou não concluiu com sucesso. O deploy concorrente permanece
  serializado e o rollback existente não foi removido.
- Não houve acesso SSH manual por esta sessão. O workflow executou deploy automático
  após a PR ser merged e a verificação pública observou 502; nenhuma ação corretiva
  manual foi tomada.
