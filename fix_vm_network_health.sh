#!/usr/bin/env bash
set -e

PG_CONTAINER="$(docker ps -a --format '{{.Names}}' | grep -E '(^ab0-postgres$|_ab0-postgres$)' | head -n 1 || true)"
if [ -z "$PG_CONTAINER" ]; then
  PG_CONTAINER="$(docker ps -a --format '{{.Names}}' --filter ancestor=postgres:14 | head -n 1 || true)"
fi

echo "Conectando Postgres à rede ab0-network com alias db"
docker network connect --alias db ab0-network "$PG_CONTAINER" 2>/dev/null || true

echo "Reiniciando backend"
docker restart ab0-backend

echo "Iniciando Redis se necessário"
docker start ab0-redis 2>/dev/null || true
docker network connect ab0-network ab0-redis 2>/dev/null || true

PGPASSWORD="$(docker exec ab0-backend printenv POSTGRES_PASSWORD)"
PGUSER="$(docker exec ab0-backend printenv POSTGRES_USER)"
PGDB="$(docker exec ab0-backend printenv POSTGRES_DB)"

echo "Testando conexão Postgres via db"
docker exec -e PGPASSWORD="$PGPASSWORD" ab0-backend psql -h db -U "$PGUSER" -d "$PGDB" -c '\q' || true

echo "Logs recentes do backend"
docker logs ab0-backend --tail 200 || true

echo "Status de saúde do backend"
docker inspect -f '{{.State.Health.Status}}' ab0-backend || true

echo "Health interno"
docker exec ab0-backend curl -sf http://localhost:3001/health || true

echo "Health externo"
curl -sf http://64.225.59.107:3001/health || true

COMPOSE_FILE="docker-compose.yml"

echo "Removendo chave version obsoleta"
sed -i '/^version:/d' "$COMPOSE_FILE" || true

echo "Removendo DATABASE_URL se existir"
if grep -q 'DATABASE_URL' "$COMPOSE_FILE"; then
  sed -i '/DATABASE_URL:/d' "$COMPOSE_FILE"
fi

echo "Aplicando fallback de POSTGRES_HOST se db não resolver"
if ! docker exec -e PGPASSWORD="$PGPASSWORD" ab0-backend psql -h db -U "$PGUSER" -d "$PGDB" -c '\q'; then
  sed -i "s/POSTGRES_HOST: db/POSTGRES_HOST: $PG_CONTAINER/" "$COMPOSE_FILE" || true
  docker compose up -d --force-recreate --no-deps backend || true
fi

if command -v ufw >/dev/null 2>&1; then
  echo "Abrindo porta 3001 no firewall"
  ufw allow 3001/tcp >/dev/null 2>&1 || true
  ufw status || true
fi

echo "Concluído"