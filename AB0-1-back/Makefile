.PHONY: help setup up down restart logs console test migrate rollback seed reset clean build ps

# Docker Compose file
COMPOSE_FILE := docker-compose.dev.yml
COMPOSE := docker-compose -f $(COMPOSE_FILE)

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m # No Color

help: ## Mostrar esta ajuda
	@echo "$(GREEN)Comandos disponíveis:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

setup: ## Configurar ambiente de desenvolvimento pela primeira vez
	@echo "$(GREEN)Configurando ambiente...$(NC)"
	@cp -n .env.development.example .env.development || true
	@chmod +x entrypoint.dev.sh
	@echo "$(GREEN)✓ Arquivos de configuração criados$(NC)"
	@$(MAKE) build
	@$(MAKE) up
	@echo "$(GREEN)✓ Ambiente configurado com sucesso!$(NC)"

build: ## Fazer build dos containers
	@echo "$(GREEN)Building containers...$(NC)"
	@$(COMPOSE) build

up: ## Iniciar todos os serviços
	@echo "$(GREEN)Iniciando serviços...$(NC)"
	@$(COMPOSE) up -d
	@echo "$(GREEN)✓ Serviços iniciados!$(NC)"
	@echo "$(YELLOW)Aguardando aplicação ficar pronta...$(NC)"
	@sleep 10
	@$(MAKE) ps

up-logs: ## Iniciar serviços com logs
	@$(COMPOSE) up

down: ## Parar todos os serviços
	@echo "$(YELLOW)Parando serviços...$(NC)"
	@$(COMPOSE) down

restart: ## Reiniciar todos os serviços
	@echo "$(YELLOW)Reiniciando serviços...$(NC)"
	@$(COMPOSE) restart
	@echo "$(GREEN)✓ Serviços reiniciados!$(NC)"

restart-app: ## Reiniciar apenas a aplicação Rails
	@$(COMPOSE) restart app
	@echo "$(GREEN)✓ App reiniciado!$(NC)"

ps: ## Listar status dos containers
	@$(COMPOSE) ps

logs: ## Ver logs de todos os serviços
	@$(COMPOSE) logs -f

logs-app: ## Ver logs da aplicação
	@$(COMPOSE) logs -f app

logs-sidekiq: ## Ver logs do Sidekiq
	@$(COMPOSE) logs -f sidekiq

logs-db: ## Ver logs do banco
	@$(COMPOSE) logs -f db

console: ## Abrir Rails console
	@$(COMPOSE) exec app bundle exec rails console

bash: ## Abrir bash no container da app
	@$(COMPOSE) exec app bash

db-console: ## Abrir console do PostgreSQL
	@$(COMPOSE) exec db psql -U postgres -d ab0_development

redis-cli: ## Abrir Redis CLI
	@$(COMPOSE) exec redis redis-cli

test: ## Executar testes
	@echo "$(GREEN)Executando testes...$(NC)"
	@$(COMPOSE) exec app bundle exec rails test

test-system: ## Executar testes de sistema
	@$(COMPOSE) exec app bundle exec rails test:system

migrate: ## Executar migrations
	@echo "$(GREEN)Executando migrations...$(NC)"
	@$(COMPOSE) exec app bundle exec rails db:migrate
	@echo "$(GREEN)✓ Migrations executadas!$(NC)"

migrate-status: ## Ver status das migrations
	@$(COMPOSE) exec app bundle exec rails db:migrate:status

rollback: ## Rollback da última migration
	@echo "$(YELLOW)Fazendo rollback...$(NC)"
	@$(COMPOSE) exec app bundle exec rails db:rollback

seed: ## Executar seeds
	@echo "$(GREEN)Executando seeds...$(NC)"
	@$(COMPOSE) exec app bundle exec rails db:seed
	@echo "$(GREEN)✓ Seeds executadas!$(NC)"

reset: ## Reset do banco de dados (⚠️  apaga dados)
	@echo "$(YELLOW)⚠️  ATENÇÃO: Isso irá apagar todos os dados!$(NC)"
	@read -p "Tem certeza? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(COMPOSE) exec app bundle exec rails db:reset; \
		echo "$(GREEN)✓ Banco resetado!$(NC)"; \
	fi

bundle: ## Instalar gems
	@echo "$(GREEN)Instalando gems...$(NC)"
	@$(COMPOSE) exec app bundle install
	@$(MAKE) restart-app

routes: ## Listar todas as rotas
	@$(COMPOSE) exec app bundle exec rails routes

health: ## Verificar health da aplicação
	@curl -s http://localhost:3001/health | jq '.' || curl -s http://localhost:3001/health

health-details: ## Verificar health detalhado
	@curl -s http://localhost:3001/health/details | jq '.' || curl -s http://localhost:3001/health/details

clean: ## Limpar containers e volumes (⚠️  apaga dados)
	@echo "$(YELLOW)⚠️  ATENÇÃO: Isso irá apagar todos os dados!$(NC)"
	@read -p "Tem certeza? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(COMPOSE) down -v; \
		docker system prune -f; \
		echo "$(GREEN)✓ Limpeza concluída!$(NC)"; \
	fi

clean-cache: ## Limpar apenas o cache do bundle
	@$(COMPOSE) down
	@docker volume rm ab0-1-back_bundle_cache || true
	@echo "$(GREEN)✓ Cache limpo!$(NC)"

backup-db: ## Fazer backup do banco
	@echo "$(GREEN)Fazendo backup...$(NC)"
	@mkdir -p tmp/backups
	@$(COMPOSE) exec -T db pg_dump -U postgres ab0_development > tmp/backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Backup salvo em tmp/backups/$(NC)"

restore-db: ## Restaurar backup do banco (use BACKUP=arquivo.sql)
ifndef BACKUP
	@echo "$(YELLOW)Uso: make restore-db BACKUP=tmp/backups/backup_20241002_120000.sql$(NC)"
	@ls -lh tmp/backups/*.sql 2>/dev/null || echo "Nenhum backup encontrado"
else
	@echo "$(YELLOW)Restaurando backup $(BACKUP)...$(NC)"
	@$(COMPOSE) exec -T db psql -U postgres -d ab0_development < $(BACKUP)
	@echo "$(GREEN)✓ Backup restaurado!$(NC)"
endif

urls: ## Mostrar URLs dos serviços
	@echo "$(GREEN)Serviços disponíveis:$(NC)"
	@echo "  🚀 API Rails:        http://localhost:3001"
	@echo "  📊 Health Check:     http://localhost:3001/health"
	@echo "  💾 Adminer:          http://localhost:8080"
	@echo "  📮 MailCatcher:      http://localhost:1080"
	@echo "  🔴 Redis Commander:  http://localhost:8081"

stats: ## Mostrar uso de recursos dos containers
	@docker stats --no-stream

# Aliases comuns
start: up ## Alias para 'up'
stop: down ## Alias para 'down'
