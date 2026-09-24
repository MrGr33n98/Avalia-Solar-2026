# Runbook de Rollback Operacional — Ranking v2 (W16 / ROLL-002)

- **Tempo Máximo de Restauração (MTTR):** `< 30 segundos`
- **Gravidade do Incidente:** P1 (se houver divergência não explicada no ranking ou falha de entrega de leads)

---

## 1. Procedimento de Rollback Imediato (Flag-Off)

Se qualquer anomalia de entrega de dados for detectada em produção:

### Passo 1: Desativar a flag do consumidor específico via ENV
Para desativar imediatamente o consumidor problemático, atualize a variável de ambiente correspondente para `false` ou remova-a:

```bash
# Exemplo: Rollback imediato no roteamento de leads
export ENABLE_CANONICAL_COVERAGE_LEADS=false

# Ou se o master switch global estava ativo:
export ENABLE_CANONICAL_COVERAGE_ALL=false
```

### Passo 2: Reiniciar os processos Puma / Sidekiq
Não é necessário rodar migrations nem rebuild de imagem Docker. O comando padrão de reload suave do Puma ou restart dos containers é suficiente:
```bash
docker compose restart backend
```

---

## 2. Restauração de Leitura de Snapshots Históricos

Se um novo cálculo diário (`RankingRun`) apresentar qualquer anomalia de população:
1. As tabelas históricas de snapshot (`CompanyRankingSnapshot`) permanecem intactas e legíveis.
2. O leitor do dashboard faz fallback imediato para o último snapshot válido anterior:
   ```ruby
   CompanyRankingSnapshot.where(company_id: company.id).order(date: :desc).first
   ```
3. O leitor nunca falha hard quando um run não está publicado.

---

## 3. Garantias de Dados

- Nenhuma tabela do banco de dados deve ser apagada (`DROP TABLE`) ou truncada.
- Os campos legados `coverage_states` e `coverage_cities` em `Company` são estritamente preservados, garantindo que o sistema funcione com 100% de integridade com o código anterior a qualquer momento.
