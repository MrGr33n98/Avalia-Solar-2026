# Groups — auditoria de delivery da feature flag

**Data:** 2026-08-25  
**Commit de configuração:** `eef826f2`

## Cadeia de entrega

### Frontend build-time

`GitHub Actions vars.NEXT_PUBLIC_GROUPS_ENABLED` é validada como `true` antes do build. O workflow passa o valor em `build-args`; `Dockerfile.frontend` declara `ARG NEXT_PUBLIC_GROUPS_ENABLED=false`, exporta no estágio `builder` antes de `npm run build` e verifica o marcador `Encontre seu grupo` no bundle quando habilitada. Nova imagem recebe tag imutável `${GITHUB_SHA}`.

### Backend runtime

`GitHub Actions vars.GROUPS_ENABLED` é encaminhada ao SSH deploy. O workflow exige valor `true` em produção. `docker-compose.yml` injeta `GROUPS_ENABLED` em `backend` e `worker`; default continua `false` fora do ambiente configurado.

### Frontend runtime

`docker-compose.yml` injeta `NEXT_PUBLIC_GROUPS_ENABLED` para diagnóstico do container. Esse valor não substitui prova build-time: `NEXT_PUBLIC_*` já está embutida durante `npm run build`.

## Verificações obrigatórias pós-deploy

Executar na VPS:

```bash
docker ps
docker exec ab0-backend printenv | grep GROUPS
docker exec ab0-worker printenv | grep GROUPS
docker exec ab0-frontend printenv | grep GROUPS
```

Esperado:

```text
GROUPS_ENABLED=true
NEXT_PUBLIC_GROUPS_ENABLED=true
```

Validar bundle funcionalmente em `https://www.avaliasolar.com.br/groups`; validar API em `https://api.avaliasolar.com.br/api/v1/groups`. Confirmar tag `${GITHUB_SHA}` do frontend nos containers/deploy metadata.

## Estado local

- Workflow, Dockerfile e Compose revisados.
- Build local anterior passou com warnings externos não relacionados a Groups.
- VPS, GHCR, API pública e URLs de produção não foram executados nesta sessão; exigem deploy real e credenciais operacionais.
- Não declarar produção habilitada antes dessas verificações.