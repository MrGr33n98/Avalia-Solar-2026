#!/bin/bash

TASKS_DIR="/Users/felipemorais/AB0-1/tasks"

# TASK-006
cat > "$TASKS_DIR/TASK-006.md" << 'EOF'
# TASK-006: Integrar Sentry para Error Tracking

**Epic:** Observabilidade 📊  
**Story Points:** 3 | **Prioridade:** P0 | **Owner:** Full Stack  
**Status:** ⏳ TODO

## 📋 Descrição
Integrar Sentry para tracking de erros em tempo real no backend e frontend.

## 📝 Subtasks
- [ ] Criar conta Sentry e projeto
- [ ] Adicionar sentry-ruby e sentry-rails
- [ ] Configurar no backend (config/initializers/sentry.rb)
- [ ] Adicionar @sentry/nextjs no frontend
- [ ] Configurar source maps
- [ ] Testar error reporting
- [ ] Configurar alerts
- [ ] Documentar processo

## ✅ Critérios de Aceitação
- [ ] Sentry instalado em backend e frontend
- [ ] Erros sendo reportados automaticamente
- [ ] Source maps funcionando
- [ ] Alerts configurados para erros críticos
- [ ] Documentação completa

**Estimativa:** 6 horas
EOF

# TASK-007
cat > "$TASKS_DIR/TASK-007.md" << 'EOF'
# TASK-007: Setup APM (Scout ou New Relic)

**Epic:** Observabilidade 📊  
**Story Points:** 5 | **Prioridade:** P0 | **Owner:** DevOps  
**Status:** ⏳ TODO

## 📋 Descrição
Implementar Application Performance Monitoring para monitorar performance, queries lentas, e gargalos.

## 📝 Subtasks
- [ ] Avaliar Scout APM vs New Relic
- [ ] Criar conta e projeto
- [ ] Adicionar gem scout_apm ou newrelic_rpm
- [ ] Configurar agent
- [ ] Instrumentar endpoints críticos
- [ ] Configurar alertas de performance
- [ ] Criar dashboards customizados
- [ ] Treinar time no uso

## ✅ Critérios de Aceitação
- [ ] APM instalado e funcionando
- [ ] Queries N+1 detectáveis
- [ ] Alertas configurados (response time > 500ms)
- [ ] Dashboards criados
- [ ] Time treinado

**Estimativa:** 10 horas
EOF

# TASK-008
cat > "$TASKS_DIR/TASK-008.md" << 'EOF'
# TASK-008: Implementar Structured Logging

**Epic:** Observabilidade 📊  
**Story Points:** 3 | **Prioridade:** P0 | **Owner:** Backend Dev  
**Status:** ⏳ TODO

## 📋 Descrição
Implementar logs estruturados (JSON) para facilitar parsing e análise.

## 📝 Subtasks
- [ ] Adicionar gem lograge
- [ ] Configurar JSON logging
- [ ] Adicionar request_id correlation
- [ ] Logar user_id quando autenticado
- [ ] Configurar diferentes níveis por ambiente
- [ ] Integrar com Sentry breadcrumbs
- [ ] Criar helpers de logging
- [ ] Documentar padrões de log

## ✅ Critérios de Aceitação
- [ ] Logs em formato JSON
- [ ] Request correlation funcionando
- [ ] User tracking em logs
- [ ] Sensitive data não logada
- [ ] Documentação completa

**Estimativa:** 6 horas
EOF

# TASK-009 through TASK-013
for i in {009..013}; do
  case $i in
    009)
      TITLE="Criar Dashboard de Métricas Básico"
      EPIC="Observabilidade 📊"
      SP="2"
      OWNER="DevOps"
      ;;
    010)
      TITLE="Adicionar Job de Testes Backend no GitHub Actions"
      EPIC="Testes CI/CD 🧪"
      SP="2"
      OWNER="Backend Dev"
      ;;
    011)
      TITLE="Adicionar Job de Testes Frontend no GitHub Actions"
      EPIC="Testes CI/CD 🧪"
      SP="2"
      OWNER="Frontend Dev"
      ;;
    012)
      TITLE="Setup SimpleCov para Coverage Report"
      EPIC="Testes CI/CD 🧪"
      SP="2"
      OWNER="Backend Dev"
      ;;
    013)
      TITLE="Setup Jest Coverage Report"
      EPIC="Testes CI/CD 🧪"
      SP="2"
      OWNER="Frontend Dev"
      ;;
  esac

  cat > "$TASKS_DIR/TASK-$i.md" << EOF
# TASK-$i: $TITLE

**Epic:** $EPIC  
**Story Points:** $SP | **Prioridade:** P0 | **Owner:** $OWNER  
**Status:** ⏳ TODO

## 📋 Descrição
[Descrição detalhada da task]

## 📝 Subtasks
- [ ] Subtask 1
- [ ] Subtask 2
- [ ] Subtask 3
- [ ] Subtask 4

## ✅ Critérios de Aceitação
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

**Estimativa:** Ver TASKS_MASTER.md
EOF
done

# TASK-014 to TASK-045 (Fase 2 e 3)
declare -A TASK_INFO
TASK_INFO[014]="Adicionar Redis ao Stack|Performance - Caching 🚀|2|DevOps|P1"
TASK_INFO[015]="Implementar Fragment Caching|Performance - Caching 🚀|3|Backend Dev|P1"
TASK_INFO[016]="Implementar Query Caching|Performance - Caching 🚀|3|Backend Dev|P1"
TASK_INFO[017]="Setup Sidekiq|Performance - Background Jobs ⚡|3|Backend Dev|P1"
TASK_INFO[018]="Migrar Email Sending para Jobs|Performance - Background Jobs ⚡|2|Backend Dev|P1"
TASK_INFO[019]="Migrar Notificações para Jobs|Performance - Background Jobs ⚡|3|Backend Dev|P1"
TASK_INFO[020]="Adicionar Bullet Gem (N+1 Detection)|Performance - Database ⚡|2|Backend Dev|P1"
TASK_INFO[021]="Implementar Paginação com Kaminari|Performance - Database ⚡|3|Backend Dev|P1"
TASK_INFO[022]="Otimizar Queries Críticos|Performance - Database ⚡|3|Backend Dev|P1"
TASK_INFO[023]="Remover ignoreBuildErrors do TypeScript|Frontend Quality 💅|2|Frontend Dev|P1"
TASK_INFO[024]="Habilitar Otimização de Imagens|Frontend Quality 💅|1|Frontend Dev|P1"
TASK_INFO[025]="Implementar Error Boundaries|Frontend Quality 💅|1|Frontend Dev|P1"
TASK_INFO[026]="Setup Swagger/rswag para API|Documentação 📚|5|Backend Dev|P2"
TASK_INFO[027]="Escrever README.md Adequado (Backend)|Documentação 📚|2|Tech Lead|P2"
TASK_INFO[028]="Escrever README.md Adequado (Frontend)|Documentação 📚|2|Tech Lead|P2"
TASK_INFO[029]="Documentar Arquitetura (ADRs)|Documentação 📚|3|Tech Lead|P2"
TASK_INFO[030]="Criar Guia de Contribuição|Documentação 📚|1|Tech Lead|P2"
TASK_INFO[031]="Setup Pre-commit Hooks (Overcommit)|Code Quality 🎯|3|DevOps|P2"
TASK_INFO[032]="Integrar CodeClimate|Code Quality 🎯|3|DevOps|P2"
TASK_INFO[033]="Refatorar Model Concerns|Code Quality 🎯|3|Backend Dev|P2"
TASK_INFO[034]="Refatorar Services|Code Quality 🎯|2|Backend Dev|P2"
TASK_INFO[035]="Aumentar Coverage Backend para 80%+|Code Quality 🎯|2|Backend Dev|P2"
TASK_INFO[036]="Melhorar Health Checks|Infraestrutura 🏗️|2|Backend Dev|P2"
TASK_INFO[037]="Criar docker-compose.dev.yml|Infraestrutura 🏗️|2|DevOps|P2"
TASK_INFO[038]="Configurar Backup Automático do DB|Infraestrutura 🏗️|3|DevOps|P2"
TASK_INFO[039]="Setup Staging Environment|Infraestrutura 🏗️|1|DevOps|P2"
TASK_INFO[040]="Auditar Reversibilidade de Migrations|Database & Migrations 🗄️|2|Backend Dev|P2"
TASK_INFO[041]="Otimizar Índices do Database|Database & Migrations 🗄️|2|Backend Dev|P2"
TASK_INFO[042]="Implementar Connection Pooling|Database & Migrations 🗄️|2|Backend Dev|P2"
TASK_INFO[043]="Avaliar Implementação de GraphQL|Features Avançadas 🚀|8|Tech Lead|P3"
TASK_INFO[044]="Implementar WebSockets (Action Cable)|Features Avançadas 🚀|5|Full Stack|P3"
TASK_INFO[045]="Avaliar ElasticSearch para Busca|Features Avançadas 🚀|8|Backend Dev|P3"

for task_num in {014..045}; do
  IFS='|' read -r title epic sp owner priority <<< "${TASK_INFO[$task_num]}"
  
  cat > "$TASKS_DIR/TASK-$task_num.md" << EOF
# TASK-$task_num: $title

**Epic:** $epic  
**Story Points:** $sp | **Prioridade:** $priority | **Owner:** $owner  
**Status:** ⏳ TODO

## 📋 Descrição
$title - Detalhes em TASKS_MASTER.md

## 📝 Subtasks
- [ ] Planejar implementação
- [ ] Desenvolver solução
- [ ] Criar testes
- [ ] Documentar
- [ ] Code review

## ✅ Critérios de Aceitação
- [ ] Funcionalidade implementada
- [ ] Testes passando
- [ ] Documentação completa
- [ ] Code review aprovado

## 📊 Estimativa
**Total:** Ver TASKS_MASTER.md para detalhes completos

## 🔗 Referências
Ver ANALISE_TECNICA_SENIOR.md

---
**Criado em:** Outubro 2024  
**Status:** ⏳ TODO
EOF
done

echo "✅ Todas as 45 tasks foram criadas!"
ls -la "$TASKS_DIR" | grep "TASK-" | wc -l
