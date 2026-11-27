# User Stories — MVP Comercial Integrado

Formato: **Como** <persona>, **quero** <ação>, **para** <valor>. Critérios no formato Dado / Quando / Então.
Rastreabilidade: cada história aponta para as lacunas do `gap-analysis.md`.

## Personas
- **Integrador comprador:** ainda não pagou e avalia os planos.
- **Integrador pagante:** dono ou gestor de uma empresa com plano.
- **Consumidor:** visitante do site ou usuário de uma IA.
- **Comercial/CS:** vende, faz onboarding e renova.
- **Admin/Financeiro:** configura planos, preços e empresas.
- **Agente de IA:** consome a vitrine pela ferramenta MCP.

---

## Épico 1 — Cobrança correta (F0/F1)

**US-01 — Período cobrado corretamente** (B1, B2)
Como integrador comprador, quero que o plano de 6 meses cobre o preço de 6 meses, para não ser cobrado errado.
- Dado o plano Essencial com os prices `6m` e `12m` distintos, quando escolho "6 meses" no checkout, então a sessão do Stripe usa o price de 6 meses e o valor exibido é igual ao do `/pricing`.
- Dado um admin salvando um plano com o mesmo price ID nos dois campos, então o save falha com a mensagem "Os preços de 6 e 12 meses precisam ser diferentes".

**US-02 — Mesmos recursos em qualquer período** (B2, D1, D2)
Como integrador comprador, quero que o Essencial tenha os mesmos recursos no período de 6 e de 12 meses, para escolher só pelo prazo.
- Dado o Essencial, então existe **um** plano com dois preços, e o recurso `leads_marketplace` tem o mesmo valor em ambos.

**US-03 — Preço único em todo lugar** (B3, P4)
Como Comercial, quero que o preço do `/pricing`, do checkout, do admin e do FAQ seja o mesmo, para não ter de explicar divergências.
- Dado um preço alterado no admin, quando abro o `/pricing`, então o novo valor aparece sem deploy.
- Não existe preço fixo no código fora de fixtures de teste.

## Épico 2 — Promessa = entrega (F1)

**US-04 — Matriz de conformidade** (E1, E2)
Como Admin, quero um teste que prove que cada plano libera e bloqueia exatamente os recursos anunciados, para vender com segurança.
- Para cada plano público × cada chave vendida, um teste de request no backend confirma liberado ou bloqueado (403 `FEATURE_NOT_AVAILABLE`).
- O CI falha se uma chave do catálogo não tiver `enforced_by` nem `display_only`.

**US-05 — Recurso pendente de verificação** (E4, D3)
Como integrador pagante Pro, quero entender por que o selo e a prova social não aparecem, para saber o que fazer.
- Dado o Pro com `verified = false`, então o dashboard mostra "Selo incluso no seu plano · aguardando verificação" com o próximo passo, e não "Bloqueado".
- Dado o Pro com `social_proof_enabled = false`, então o mesmo padrão vale para a prova social.

**US-06 — Limites de upload do meu plano** (E3)
Como integrador Pro, quero os limites de upload do Pro, para publicar o portfólio contratado.
- Dado o Pro, quando consulto `/company_upload_limits`, então os limites são os do Pro.

**US-07 — Vitrine com o meu portfólio** (P1, P2)
Como integrador Pro, quero que a vitrine mostre meus projetos publicados.
- Dado a WEG (Pro) com 1 projeto publicado, então `/api/v1/storefronts/weg` devolve 1 projeto.
- Dado uma empresa Essencial, então a vitrine não expõe projetos, e o dono vê um teaser no dashboard.

**US-08 — IA mostra a vitrine** (P3)
Como agente de IA, quero chamar `show_storefront_profile` e receber a vitrine sem erro.
- `tools/call` com um slug válido → `isError: false`; slug inválido → `-32602`; nunca 500.

## Épico 3 — Upsell honesto (F1/F3)

**US-09 — Upsell aponta para o plano certo** (U1, U2, D4, D7)
Como integrador, quero que o botão de upgrade me leve ao plano que realmente libera o recurso.
- O `feature_access[key]` devolve `unlock_plan` = o menor plano público que libera a chave.
- Se nenhum plano público libera a chave → o texto é "Fale com o comercial", sem nome de plano.
- Nunca aparece "Desbloquear com <plano atual>".
- Nunca aparece um plano que não existe.

**US-10 — Upgrade em um clique** (U5)
Como integrador, quero que o CTA de upgrade abra o checkout do plano certo.
- O link leva a `/pricing?plan=<id>&feature=<key>` com o plano pré-selecionado; o evento `upgrade_cta_clicked` vai ao GA4 com `feature_key`.

**US-11 — Meu plano** (U4, U6)
Como integrador pagante, quero ver meu plano, a validade, o que está incluso, o uso dos limites e o que está pendente.
- A aba "Plano e recursos" mostra a mesma matriz do "Plan Access Preview" do admin, em linguagem de cliente.
- O card da sidebar mostra o nome do plano atual, e não "Plano Empresarial".

## Épico 4 — Números confiáveis e prova de valor (F2)

**US-12 — Um número por métrica** (U3)
Como integrador pagante, quero que "leads dos últimos 30 dias" seja o mesmo número em todo o dashboard e no admin.
- Existe uma definição escrita de lead, CTA e visualização por período.
- Um teste de consistência compara os cards, o bloco de atribuição, a aba Leads e o admin para a mesma empresa e período.

**US-13 — Leads por origem, incluindo IA** (P6)
Como integrador pagante, quero ver quantos leads vieram do ChatGPT, do Claude, do Google ou de acesso direto.
- O lead criado a partir de uma visita com `utm_medium=ai_agent` ou referrer de IA grava a origem; o dashboard agrupa por origem; o GA4 recebe `ai_agent_type`.

## Épico 5 — Governança do admin (F3/F4)

**US-14 — Motivo obrigatório** (AD1)
Como Financeiro, quero saber por que um plano mudou.
- Salvar um plano sem `change_reason` falha; mudança de preço ou price ID notifica o canal financeiro.

**US-15 — Painel de conformidade** (AD2)
Como Admin, quero ver, por plano, os recursos vendidos, os aplicados, as empresas afetadas e as divergências.

**US-16 — Toda empresa tem plano** (E6, D5)
Como Admin, quero que toda empresa ativa tenha um plano explícito.
- Depois do backfill, `Company.where(plan_id: nil).count == 0`; as novas empresas nascem no Free.

**US-17 — Status reflete o código** (G1)
Como time, quero que nenhum documento marque como concluído o que não tem teste.
- O fechamento de spec exige um drift report e um link para o teste de cada item marcado.
