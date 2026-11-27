# Spec 027 — MVP Comercial Integrado (Planos × Admin × App × Público)

**Data:** 27/11/2026 · **Status:** proposta para aprovação · **Dono da decisão:** Produto/Comercial

## 1. Objetivo
Garantir que **o que é vendido, o que é configurado no admin, o que é cobrado no Stripe, o que o integrador vê no dashboard e o que o público vê no site e nas IAs sejam a mesma coisa**, com prova auditável.

A defensibilidade comercial depende disso: nenhum cliente deve pagar por algo que não recebe, receber de graça algo que é pago, ou ver números contraditórios sobre o valor que recebeu.

## 2. Por que agora (evidência de 27/11/2026)
A auditoria E2E (`evidence/auditoria-planos-recursos-2026-11-27.md`) encontrou, **em produção**:
- o mesmo price ID do Stripe para 6 e 12 meses nos três planos pagos;
- o Essencial de 6 meses (R$ 330) com mais recursos (leads) que o anual (R$ 590);
- upsell "Desbloquear com Plano Essencial" para recursos que o Essencial não libera;
- cliente Pro vendo "Desbloquear com Plano Pro";
- upsell para um "Plano Enterprise" que não existe;
- Pro sem prova social nem selo, embora estejam no plano;
- 3 recursos vendidos que nenhum código aplica;
- leads do mesmo período em 4 números diferentes (26, 11, 1 e 1);
- vitrine sem os projetos publicados da empresa.

## 3. Relação com outras specs (não duplicar)
| Spec | Relação |
|---|---|
| 006 — Dashboard MVP defensibility | Base de tenant, dados e prova de valor do dashboard. A 027 trata **planos e monetização ponta a ponta** |
| 022 — Dashboard (Fases B/C/D) | Desempenho e UX do dashboard. A 027 não mexe em layout |
| 026 — Agentic Storefront | `specs/026-agentic-storefront/prd.md`. A 027 incorpora a F0/F1 do PRD (vitrine respeitando o plano) |
| GA4/GSC Intelligence | Eventos e atribuição. A 027 depende de `generate_lead` e `ai_agent_type` corretos |

## 4. Documentos deste pacote
| Arquivo | Conteúdo |
|---|---|
| `gap-analysis.md` | Lacunas por camada → causa → solução → prioridade |
| `user-stories.md` | Histórias por persona com critérios de aceite |
| `tasks.md` | Task list por fase, com dependências, testes e skills |
| `skills.md` | Skills, agentes e MCPs por fase, e como usar |
| `evidence/auditoria-planos-recursos-2026-11-27.md` | Auditoria E2E somente leitura (admin, app, público, código) |

## 5. Princípio de arquitetura: uma fonte de verdade
```
PlanFeatureCatalog (código: chaves, tipos, rótulos, como cada uma é aplicada)
        │
Plan (admin/DB: valores por plano, preço, price IDs por período)
        │
Company (plano + overrides auditados)
        │
EntitlementService / CompanyFeatureAccessResolver  ← única porta de decisão
        │
 ┌──────┼─────────────┬───────────────┬────────────────┐
 ▼      ▼             ▼               ▼                ▼
API   Dashboard     /pricing        Perfil/Vitrine   MCP/IA
(403) (travas e     (matriz         (o que é         (mesmos dados
       upsell        gerada do       público)         e mesmas regras)
       calculado)    catálogo)
```
Nenhuma camada pode ter texto, preço ou regra de plano **fixo no código** fora desse fluxo.

## 6. Definição de "MVP comercial defensável" (gate de saída)
1. **Cobrança correta:** cada plano e período tem um price ID distinto e validado; o checkout cobra o que a página mostra.
2. **Promessa = entrega:** para cada plano × recurso, um teste automatizado prova que o backend libera ou bloqueia conforme o catálogo (matriz de conformidade).
3. **Upsell honesto:** o CTA de upgrade sempre aponta para o menor plano **existente e público** que libera o recurso, e nunca aparece para quem já o tem.
4. **Nada vendido sem aplicação:** toda chave do catálogo tem ponto de aplicação no backend ou é marcada `display_only` e retirada da venda.
5. **Números únicos:** leads, CTAs e visualizações por período vêm de uma única fonte, e o dashboard e o admin mostram o mesmo valor.
6. **Trilha de auditoria:** toda alteração de plano ou override exige motivo e fica registrada.
7. **Prova de valor:** o integrador vê os leads atribuídos por origem, incluindo IA.
8. **Vitrine e IA respeitam o plano** e mostram dados reais.

## 7. Decisões pendentes (bloqueiam partes da Fase 1)
| ID | Decisão | Opções | Recomendação |
|---|---|---|---|
| D1 | Essencial 6 meses × anual | (a) um plano com dois preços (6m/12m) e os mesmos recursos · (b) manter dois planos | **(a)**: elimina a divergência de recursos |
| D2 | Leads no Essencial | (a) incluir em ambos · (b) retirar de ambos | Comercial decide; precisa ser igual nos dois períodos |
| D3 | Prova social e selo | (a) o plano libera sozinho · (b) mantém a dupla condição (plano + moderação) e deixa isso explícito na venda | **(b)**, com o status "aguardando verificação" visível ao cliente |
| D4 | Plano Enterprise | (a) criar · (b) remover do código e dos textos | **(b)** até haver oferta real |
| D5 | Empresas sem plano (582) | (a) vincular ao Free (backfill) · (b) manter "sem plano = Free implícito" | **(a)**: exige migração de dados aprovada |
| D6 | Recursos sem aplicação (`local_seo_visibility`, `premium_profile`, `forum_highlight`) | (a) implementar · (b) retirar da venda | **(b)** agora, (a) no roadmap |
| D7 | Assistente IA no Pro | (a) incluir no Pro · (b) criar add-on · (c) ocultar | Comercial decide |
