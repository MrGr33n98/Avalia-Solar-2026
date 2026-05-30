# 🏛️ Matriz de Governança e Aprovações Humanas: Hermes Agent

Este documento regulamenta a governança de automações do **Avalia Solar & Mobilidade Elétrica**, delineando de forma clara quais processos operacionais são 100% automatizados (sem necessidade de validação humana) e quais exigem aprovação de um operador por segurança de marca, compliance ou confidencialidade comercial.

---

## 📊 Tabela Geral da Matriz de Governança

| Ação Operacional | Pode Ser Automática? | Precisa de Revisão? | Nunca Automatizar? | Rationale / Justificativa | Canal de Aprovação | Responsável |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Validação de CNPJ e Cadastro** | Sim | Não | Não | Processo meramente cadastral de consulta a APIs públicas e deduplicação no banco de dados. | N/A (Executado Silencioso) | Operações |
| **Abordagem LinkedIn Fria** | Não | Sim | Não | Mensagens diretas em nome do CEO ou time comercial exigem tom perfeito para evitar spam e garantir alta conversão. | Slack `#aprovacao-outbound` | Marketing / Vendas |
| **Resposta de DM / Comentário Geral** | Sim | Não | Não | Respostas pré-definidas usando templates seguros de marketing com links para conversão. | N/A (Executado Silencioso) | Marketing |
| **Resposta Gmail de Lead Quente** | Não | Sim | Não | Leads corporativos solicitando cotação de alto ticket demandam contexto e personalização que só um humano finaliza. | Rascunhos do Gmail | Vendas |
| **Resposta Gmail a Cancelamento** | Não | Não | Sim | Crítico para retenção. Negociações de cancelamento de planos premium precisam de acolhimento humano consultivo exclusivo. | Slack `#atendimento-urgente` | Customer Success |
| **Resposta a Crítica / Reclamação** | Não | Não | Sim | Interações públicas em tom agressivo ou que reclamam de falhas devem ser tratadas individualmente por assessoria/direção. | Canal Interno / Slack | Direção / CS |
| **Tratamento de Contato Jurídico** | Não | Não | Sim | Qualquer e-mail ou DM contendo termos legais, processos judiciais ou notificações extrajudiciais deve ser escalado. | E-mail corporativo / Slack | Direção / Advogado |
| **Ativação de Plano Stripe** | Sim | Não | Não | Fluxo comercial padrão pós-cobrança confirmada pelo webhook oficial. Reduz fricção operacional. | N/A (Executado Silencioso) | Financeiro |
| **Recuperação de Checkout Abandonado**| Sim | Não | Não | Disparos estruturados de cupons baseados em eventos Stripe sem interações sensíveis adicionais. | N/A (Executado Silencioso) | Growth |
| **Exclusão de Dados (Opt-Out/LGPD)** | Sim | Não | Não | A legislação exige velocidade no descadastro. O processamento deve ser imediato para garantir conformidade legal. | Central de Logs / Auditoria | DPO / TI |
| **Reversão / Estorno Financeiro** | Não | Não | Sim | Movimentações financeiras de crédito e devolução de valores Stripe requerem auditoria manual de faturamento. | Dashboard Stripe / Slack | Diretor Financeiro |
| **Publicação de Review Positivo** | Sim | Não | Não | Comentários com 4 ou 5 estrelas são de baixo risco e ajudam no ranqueamento em tempo real do ecossistema. | N/A (Executado Silencioso) | Suporte |
| **Publicação de Review Negativo** | Não | Sim | Não | Reviews com pontuação baixa (1 a 3 estrelas) são retidos para apuração interna com a integradora antes da publicação. | Dashboard Moderador / Slack | Customer Success |
| **Geração de Pauta de SEO** | Sim | Não | Não | Análise semântica e estruturação inicial de ideias baseada puramente nos logs do GSC e tendências do CRM. | N/A (Executado Silencioso) | Marketing |
| **Publicação de Artigo no WordPress** | Não | Sim | Não | Revisão final de copy, links internos, formatação e verificação de coerência de marca antes do artigo ir ao ar. | WordPress Rascunhos / Slack | Editor de Conteúdo |
| **Alteração de Parâmetros SMTP/DNS** | Não | Não | Sim | Ajustes de chaves SPF, DKIM e DMARC alteram a infraestrutura e podem derrubar a entregabilidade global dos domínios. | Painel Host / DNS Interno | Operador de Infra/TI |
| **Alteração de Prompt/Regras Hermes** | Não | Sim | Não | Modificações na lógica de decisões cognitivas do Hermes Agent devem passar por crivo antes de serem enviadas para produção. | CLI / Config de Repositório | Engenheiro IA / Ops |

---

## ⚡ Fluxo de Trabalho de Aprovação no Slack (Hermes IA -> Slack -> Humano)

1.  **Ingestão de Ação Sensível**: O Hermes Agent detecta que uma tarefa (como postagem de artigo ou envio de convite LinkedIn personalizado) está pronta para ser executada.
2.  **Postagem de Card de Aprovação**: O Hermes monta um bloco no Slack (`block_kit`) contendo:
    *   **Título**: Identificação clara da ação.
    *   **Payload**: Cópia do texto gerado ou parâmetros que seriam enviados.
    *   **Contexto**: ID do Lead, Cidade e Potencial.
    *   **Botões**: `Aprovar` e `Rejeitar` (com campo opcional de feedback).
3.  **Processamento da Decisão**:
    *   Se o Humano clica em **Aprovar**: O webhook é recebido pelo script `verify-credentials.ts` (ou orquestrador correspondente), grava a aprovação técnica nos logs e executa a tarefa imediatamente.
    *   Se o Humano clica em **Rejeitar**: O Hermes cancela a tarefa na fila, envia um alerta de confirmação e, se houver justificativa escrita, alimenta a base de feedback para readequação inteligente de prompts nas próximas rodadas.
