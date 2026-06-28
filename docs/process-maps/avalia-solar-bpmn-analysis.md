# Avalia Solar — análise de processos para o mapa BPMN

Data da análise: 2026-06-28

## Convenção de evidência

- `PUBLIC`: observado em páginas públicas indexadas do site.
- `CODE`: confirmado no frontend/backend do workspace.
- `MOCK`: existe no código como simulação, protótipo ou implementação incompleta.
- `VALIDAR`: hipótese operacional recomendada; requer confirmação de processo, responsável ou SLA.

## Estrutura do diagrama

O mapa percorre cinco seções da esquerda para a direita e mantém quatro pools BPMN horizontais: Cliente, Marketplace Avalia Solar, Instalador/Empresa e Sistemas Externos.

1. Descoberta e aquisição.
2. Avaliação, busca e comparação.
3. Qualificação, OTP, matching e contato.
4. Cadastro, verificação, operação e monetização B2B.
5. Pós-venda, reviews, suporte e disputas.

## Fluxo confirmado do cliente

- Entrada por Google/SEO local, anúncios, conteúdo e acesso direto.
- Home com seleção de categoria e localização; páginas de categorias, empresas, busca e páginas locais por estado/cidade.
- Perfil de empresa com visão geral, serviços, avaliações, projetos e contato; CTAs de comparar, solicitar orçamento, avaliar e reivindicar perfil.
- Comparação de empresas e leitura de reputação, reviews, verificação, cobertura, ticket e portfólio.
- Dois caminhos de conversão:
  - contato direto por WhatsApp/telefone;
  - formulário simples ou wizard dinâmico de orçamento.
- Formulário simples: nome, e-mail, telefone, tipo de projeto, orçamento estimado, localização e mensagem.
- Wizard: categoria/vertical, necessidade, localização, dados do projeto e contato; criação do lead, envio de OTP por e-mail, validação e distribuição.
- Após OTP válido, o lead muda para `verified` e depois `distributed`; a resposta contém as empresas destinatárias.

## Matching e distribuição

- O motor considera cidade exata, cidade coberta, estado exato e estado coberto.
- O ranking também usa empresa verificada, avaliação média, volume de reviews, plano pago, FAQs, mídia, WhatsApp e prioridade do segmento instalador.
- No recomendador do chat, os pesos observados incluem: cidade exata +40, cobertura da cidade +35, estado exato +20, cobertura do estado +15, verificação +15, reputação/volume de reviews e sinais de riqueza do perfil.
- A distribuição grava `LeadDistribution`, dispara analytics e disponibiliza o lead no painel da empresa, sujeito a regras de acesso/plano.

## Fluxo confirmado do instalador

- Cadastro/autenticação, seleção ou reivindicação de empresa e envio de documentos.
- Solicitação de acesso pode ficar pendente, ser aprovada ou rejeitada; empresa bloqueada/inativa/pending impede avanço normal.
- Painel contém visão geral, informações da empresa, categorias, produtos/serviços, fotos/vídeos/portfólio, reviews, leads, chat, analytics, campanhas, aprovações, configurações e integrações/webhooks conforme plano.
- Chat P2P usa estados `open`, `pending_user`, `pending_company`, `resolved` e `blocked`, com SLA padrão de quatro horas para resposta da empresa.
- A empresa pode responder avaliações, resolver/reabrir conversas, denunciar ou bloquear.

## Reviews, moderação e disputas

- Avaliação exige login e possui três passos: categoria; nota geral e critérios; conteúdo editorial (título, prós, contras, dica e relato).
- A avaliação é enviada para validação antes da publicação.
- Moderação automática básica sinaliza autoavaliação e PII (e-mail/CPF); usuário com review aprovado anterior pode ser aprovado automaticamente; demais permanecem pendentes.
- Admin pode aprovar, rejeitar ou sinalizar; a decisão gera log, notificação ao autor, e-mail e evento no Slack.
- Conversas podem ser denunciadas por spam, abuso, fraude, conteúdo impróprio ou outro; o relatório passa por `open`, `reviewing`, `dismissed` ou `actioned`.
- Suporte público confirmado por WhatsApp/equipe e e-mail; ticket é citado pela base do assistente, mas o ciclo de ticket não foi encontrado como módulo completo e será marcado `VALIDAR`.

## Pagamentos e monetização

- `CODE`: assinatura B2B da empresa via Stripe Checkout, customer, plano mensal, possível taxa de setup, webhook/sincronização e portal de cobrança.
- `CODE`: compra de banners patrocinados com Stripe ou Mercado Pago.
- `MOCK`: Avalia Solar Pay/escrow cria PaymentIntent simulado e dois marcos de 50% (equipamentos; instalação/homologação). A liberação apenas altera status; Stripe Connect é comentário de implementação futura.
- Não foi comprovada uma comissão operacional por lead ou por instalação no fluxo atual. O diagrama marca esse ponto como decisão estratégica `VALIDAR`, sem apresentá-lo como existente.

## Evidências usadas no desenho

- Busca da home: categoria + localização + “Buscar Empresas”.
- Perfil: “Comparar”, “Solicitar Orçamento”, abas de serviços/reviews/projetos/contato e selo de perfil verificado.
- WhatsApp: “Olá, gostaria de solicitar um orçamento pelo Avalia Solar.”
- Confirmação do lead: “Obrigado! Passaremos seus contatos para as melhores empresas verificadas.”
- Review: passos 1–3 e confirmação “Nossa equipe irá validar os dados editoriais para publicação em breve.”
- Painel: Leads, Chat, Reviews, Perfil, Portfólio, Analytics, Billing e Webhooks.
