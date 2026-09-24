# Estratégia de Backfill Idempotente e Reversível de Snapshots (SNAP-004)

- **Status:** Proposta de Engenharia / Homologação Pré-Produção.
- **Autoridade:** ADR 0005, ADR 0010 e W9 Snapshot Domain.
- **Princípio:** NENHUM DADO DE PRODUÇÃO É ALTERADO OU SOBRESCRITO SEM AUTORIZAÇÃO EXPLÍCITA E DRY-RUN AUDITADO.

---

## 1. Contexto

A tabela legada `company_ranking_snapshots` armazena snapshots diários por empresa e escopo simples (`global` ou `category`), usando a versão de definição fixa `organic-performance-v2`.

Com a introdução do modelo canônico `RankingRun` e do `MethodologyManifest` (com digest SHA-256 e tupla canônica de `RankingScope`), é necessário assegurar que:
1. Registros antigos permaneçam 100% legíveis via [SnapshotReader](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/services/ranking/snapshot_reader.rb).
2. Qualquer migração histórica futura para a estrutura canônica seja estritamente **aditiva**, **idempotente** e **reversível**.

---

## 2. Princípios de Execução do Backfill

1. **Leitura Dual Ativa (Zero Breaking Changes):**
   - Todos os consumidores de leitura utilizam `Ranking::SnapshotReader`, que abstrai a origem do dado (legado vs canônico).
   - Não há dependência temporal para a conclusão do backfill.

2. **Lotes Pequenos com Cursors (Batch Chunking):**
   - Execução em lotes de no máximo 500 registros por iteração (`in_batches(of: 500)`).
   - Pausa (`sleep 0.1s`) entre lotes para não onerar o pool de conexões nem causar contenção de I/O no PostgreSQL.

3. **Idempotência Garantida:**
   - O identificador do backfill é determinístico baseado no hash do registro legado:
     `digest = Digest::SHA256.hexdigest("legacy-#{snapshot.id}-#{snapshot.snapshot_date}")`
   - Cláusula `ON CONFLICT (scope_key, as_of, manifest_digest) DO NOTHING` ou verificação prévia de existência.

4. **Reversibilidade (Rollback Instantâneo):**
   - Qualquer tabela ou coluna canônica recebe a flag de proveniência `provenance: 'backfill_v1'`.
   - Em caso de inconsistência, o rollback é trivial:
     `RankingRun.where("metadata->>'provenance' = 'backfill_v1'").delete_all`
   - A tabela legada `company_ranking_snapshots` **nunca é apagada ou truncada**.

---

## 3. Checklist Pré-Execução

- [ ] Backup ou snapshot RDS recente validado.
- [ ] Execução em ambiente de Staging com amostra de 10.000 linhas.
- [ ] Comparação via `SnapshotReader` atestando 0% de divergência de nota, posição e data.
- [ ] Aprovação formal do comitê de dados e engenharia.
