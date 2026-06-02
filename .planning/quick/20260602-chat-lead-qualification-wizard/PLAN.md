---
status: in_progress
created: 2026-06-02
slug: chat-lead-qualification-wizard
---

# Quick Task: Wizard de qualificação de leads no MobiVolt AI

## Objetivo

Substituir o formulário estático do chatbot por um fluxo interativo de qualificação, iniciado logo após a escolha da vertical, com perguntas específicas para energia solar e mobilidade elétrica. Persistir a jornada no lead comercial e encerrar o fluxo com recomendações de empresas da região e acesso aos reviews disponíveis.

## Escopo

### Frontend
- Criar wizard progressivo com respostas em botões para intenção, perfil do projeto, momento de compra e faixas relevantes por vertical.
- Permitir descrição breve para necessidades fora das opções.
- Capturar cidade, UF, nome, WhatsApp e consentimento LGPD.
- Reutilizar o chat existente para disparar a recomendação final e exibir cards com acesso aos reviews.
- Corrigir o contrato de captura do lead e pequenos desalinhamentos do hook do chat.

### Backend
- Manter a captura idempotente existente em `chat_leads`.
- Retornar contrato compatível com o frontend na criação do lead.
- Sincronizar as respostas guiadas para `leads.wizard_answers`.
- Interpretar a categoria escolhida na busca final e filtrar empresas cadastradas por categoria, cidade e estado.

## Verificação

- Rodar checks sintáticos focados em TypeScript e Ruby.
- Rodar `git diff --check`.
- Executar testes focados quando o runtime local estiver disponível.
