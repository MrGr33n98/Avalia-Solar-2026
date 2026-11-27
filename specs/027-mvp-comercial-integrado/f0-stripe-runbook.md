# F0 — Runbook Stripe + Admin (preços por período)

**Data:** 27/11/2026 · **Executor:** usuário (ação manual) · **Tarefas:** T001, T002 (`tasks.md`)

## Estado do Stripe (conta live, informado pelo usuário em 27/11/2026)
Nenhum preço tem assinatura ativa (MRR R$ 0). Trocar IDs não afeta quem já paga.

| Produto | Preço | Intervalo | Nome no Stripe | Uso |
|---|---|---|---|---|
| Plano Essencial `prod_Uc2Dia8bQ5UFNU` | R$ 590 | anual | Plano Essencial — 12 meses (17/08) | campo 12 meses |
| | R$ 330 | a cada 6 meses | Plano Essencial — 6 meses (17/08) | campo 6 meses |
| | R$ 590 | anual | padrão (30/05) | sobra: arquivar |
| | R$ 59 | mensal | — (30/05) | sobra: arquivar |
| Plano Pro `prod_UawvDi3Twhl94S` | R$ 1.500 | anual | Plano Pro — 12 meses (17/08) | campo 12 meses |
| | R$ 840 | a cada 6 meses | Plano Pro — 6 meses (17/08) | campo 6 meses |
| | R$ 1.500 | anual | padrão (27/05) | sobra: arquivar |
| | R$ 150 | mensal | Mensalidade Plano Pro (30/05) | sobra: arquivar |

Hoje o admin aponta: plano 2 → `…RT2265bB` (nos 2 campos); plano 3 → `…QKtHgyYx` (nos 2 campos); plano 4 → `…2g5qrXKv` (nos 2 campos). Não se sabe a qual linha cada ID corresponde: copiar os IDs no Stripe.

## Passos
1. **Stripe:** abrir cada preço "— 6 meses" e "— 12 meses" (17/08) e copiar o `price_…`.
2. **Admin `/admin/plans`:**

| Plano | Campo 6 meses | Campo 12 meses |
|---|---|---|
| 2 · Essential | Essencial — 6 meses (R$ 330) | Essencial — 12 meses (R$ 590) |
| 3 · Pro | Pro — 6 meses (R$ 840) | Pro — 12 meses (R$ 1.500) |
| 4 · Essencial 6 meses | apagar | apagar + desmarcar "Exibir no /pricing" |

   Preencher o motivo: "Separar preços de 6 e 12 meses (auditoria 27/11)".

   **Ordem:** limpar primeiro o plano 4. Depois do deploy da T010, o admin recusa um price ID que já esteja em outro plano ou repetido nos dois campos do mesmo plano.
3. **Opcional:** arquivar (não excluir) os 4 preços que sobram, depois de trocar o preço padrão do produto.
4. **Teste sem cobrar:** iniciar o checkout das 4 combinações e parar na tela do Stripe. Esperado: R$ 330/6m, R$ 590/ano, R$ 840/6m + setup R$ 499, R$ 1.500/ano + setup R$ 499.

## Por que limpar o plano 4
`Billing::SubscriptionSyncService` descobre o plano por `Plan.find_by(stripe_price_id_monthly|yearly: price_id)`. O mesmo ID em dois planos deixa a resolução ambígua; um ID sem nenhum plano faz uma assinatura nova cair no Free.

## Pontos abertos revelados pelo Stripe
- WEG (372), GoodWe (944) e Kaju (1137) estão no Pro **sem assinatura no Stripe**: plano atribuído manualmente. Registrar se é cortesia (com prazo) ou cobrança fora do Stripe.
- A descrição do Essencial no Stripe promete "selo visual de integradora verificada", mas o selo depende de verificação manual (D3). Ajustar o texto para "após verificação".
- **D2 pendente:** o Essencial unificado inclui `leads_marketplace`? O plano 2 diz não, o plano 4 diz sim; os recursos do plano 2 passam a valer para os dois períodos.
