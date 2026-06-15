# Estratégia de Ranking — Avalia Solar

## Objetivo

O ranking do marketplace Avalia Solar deve equilibrar **relevância comercial** (monetização via patrocínio) e **relevância de qualidade** (confiança do consumidor), seguindo o padrão de marketplaces como G2, Capterra e OLX.

---

## Fase 1 — Ranking PostgreSQL (atual)

Implementado via `ordered_by_priority` scope no model Company:

```sql
CASE WHEN sponsored THEN 1 ELSE 0 END DESC,
(COALESCE(rating_avg, 0) * 0.6 + COALESCE(rating_count, 0) * 0.0001 + priority_score) DESC,
COALESCE(rating_avg, 0) DESC,
COALESCE(rating_count, 0) DESC,
name ASC
```

### Fatores

| Fator | Peso | Fonte |
|---|---|---|
| Patrocinada | Topo garantido | `sponsored = true` |
| Nota média | 60% do score | `rating_avg` |
| Volume de reviews | 0.01% por review | `rating_count` |
| Priority Score manual | Admin | `priority_score` |
| Nome (desempate) | Alfabético | `name` |

---

## Fase 3+ — Ranking OpenSearch (futuro)

Quando o OpenSearch for integrado, o score de relevância será expandido:

### Score Composto (planejado)

```
score = (
  sponsored_boost * 1000 +          # Patrocinado: garante topo transparente
  text_relevance_score * 40 +        # Relevância textual da busca
  (rating_avg / 5.0) * 25 +         # Nota: peso 25%
  category_match_boost * 15 +        # Aderência à categoria buscada
  city_match_boost * 10 +            # Aderência à cidade buscada
  verified_boost * 5 +               # Empresa verificada: +5 pontos
  profile_completion_boost * 3 +     # Completude do perfil
  recency_boost * 2                  # Recência (cria_do há menos de 6 meses)
)
```

### Badges de Transparência

Toda empresa com impulso comercial deve exibir badge visível:
- 🟡 **Patrocinado** — empresa pagou por destaque
- ✅ **Verificado** — passou pelo processo de verificação Avalia Solar
- 🏆 **Top Avaliado** — nota acima de 4.5 com mínimo de 10 reviews
- 💎 **Premium** — assinante do plano Premium ativo

### Regras de Qualidade Mínima

Nenhuma empresa deve aparecer no ranking se:
- Status ≠ `active`
- Nota < 1.0 (se tiver reviews)
- Perfil < 30% de completude

---

## Princípios de Monetização Ética

1. **Transparência**: patrocinados sempre visíveis com badge
2. **Piso de qualidade**: empresa muito mal avaliada não fica no topo, mesmo pagando
3. **Não degradar experiência**: consumidor sempre vê empresas relevantes primeiro
4. **Documentação pública**: critérios de ranking publicados para as empresas
