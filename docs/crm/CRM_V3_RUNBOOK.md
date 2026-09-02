# Runbook CRM V3

```bash
docker compose build backend
docker compose up -d backend
docker compose exec backend bundle exec rails db:migrate
docker compose exec backend bundle exec rails zeitwerk:check
curl http://127.0.0.1:3001/health/liveness
cd AB0-1-front && npm run typecheck && npm run build
```

Rollback: restaurar imagem anterior; não remover migrations aplicadas. Validar
backup PostgreSQL antes de qualquer reversão de dados.
