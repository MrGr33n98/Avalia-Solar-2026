# Spec 020 — EVIDENCE CONTRACTS

## 1. `_meta["avaliasolar/evidence"]` (resposta MCP)

```json
{
  "_meta": {
    "avaliasolar/evidence": {
      "schema": "avaliasolar.evidence/1",
      "evidence_id": "asev_3f1c…(64 hex)",
      "content_sha256": "9a0b…(64 hex)",
      "request_id": "req_01J…",
      "tool": "list_integrators",
      "contract_version": "1.0.0",
      "data_as_of": "2026-11-25T14:03:00Z",
      "source_type": "platform_derived",
      "surface": "public"
    }
  }
}
```

| Campo | Regra |
|---|---|
| `content_sha256` | SHA-256 do JSON canônico de `structuredContent` (chaves ordenadas, UTF-8, sem espaços). |
| `evidence_id` | `"asev_" + sha256(canonical({tool, contract_version, normalized_args, content_sha256, data_as_of}))`. |
| `normalized_args` | Argumentos após `Mcp::Public::InputValidator`, sem o `cursor` opaco (o cursor entra só como digest). |
| `request_id` | O mesmo `X-Request-Id` do Rails; **não** entra no hash. |
| `surface` | `public` ou `private`. Em `private`, o tenant **não** aparece em `_meta`. |
| Erro | Só `request_id`, `tool` e `schema`. |

**Por que coexiste com o REA:** o REA usa `ev_<sha256>` com registros canônicos (`evidence_format: 2`). O prefixo `asev_` evita colisão semântica. Um bundle REA pode citar um `asev_` como `subject` externo, mas o inverso não acontece.

## 2. Canonicalização

1. Hash → ordenação recursiva de chaves.
2. Floats: os valores atuais são inteiros, strings e decimais já serializados como string. Se aparecer float, serializar com `Float#to_s` do Ruby e documentar.
3. Datas em ISO-8601 UTC com `Z`.
4. Teste de propriedade: N=1.000 payloads aleatórios, com hash estável entre duas execuções e entre MRI 3.2 e o container de produção.

## 3. Evento de log `mcp.evidence` (ledger fase 1)

```json
{"event":"mcp.evidence","schema":"avaliasolar.evidence-log/1","at":"…Z",
 "evidence_id":"asev_…","request_id":"req_…","tool":"compare_integrators",
 "surface":"public","status":"ok","duration_ms":41.2,"content_sha256":"…",
 "client_id_digest":"sha256:…","tenant_digest":null,"quota_mode":"oauth",
 "ui_resource_uri":"ui://avalia-solar/compare/v1.html","ui_manifest_sha256":"…"}
```

- **Sem** `structuredContent`, argumentos livres, IP, e-mail, token ou `agent_id` bruto.
- `ui_manifest_sha256` liga a resposta ao **release do widget** (F-42), o que fecha a rastreabilidade produto ↔ build.
- Retenção: a mesma política do agregador de logs atual (não verificada nesta auditoria; ver T-012).

## 4. Bundle de evidência de CI (artefato `evidence-bundle-<sha>`)

```
evidence/
  index.json            # {git_sha, rea_version, node_version, started_at, items:[{kind, file, evidence_id, sha256}]}
  contract.evidence.json
  widgets/<surface>.static.summary.json
  widgets/<surface>.<theme>.png + .evidence.json
  manifest.json         # cópia do packages/mcp-ui/dist/manifest.json
  diff.md               # comparação contra o último bundle da main
```

Regras:

- Todo item tem `evidence_id` (REA `ev_…`) e `sha256` do arquivo.
- `diff.md` lista: Δ bytes raw e gzip por widget, Δ de SHA, screenshots com `compare-web-screenshots` ≠ idêntico, e operações OpenAPI adicionadas ou removidas.
- **Nada** de staging ou produção; só fixtures (`packages/mcp-ui/src/fixtures`).

## 5. Ligação com approvals (F-31)

Quando uma tool r2/r3 for executada via approval, o `mcp.evidence` inclui `approval_request_uuid` e `payload_digest` da tabela existente. **Nenhuma coluna nova.**
