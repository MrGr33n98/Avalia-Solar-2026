---
status: complete
completed: 2026-06-02
slug: chat-lead-qualification-wizard
---

# Quick Task Summary: Wizard de qualificação de leads no MobiVolt AI

## Entrega

O formulário estático do chatbot foi substituído por um wizard interativo iniciado após a escolha entre energia solar e mobilidade elétrica.

### Jornada guiada
- Fluxo solar com objetivo, perfil residencial/comercial/rural/condomínio, faixa da conta de luz, momento de compra, cidade, UF, contato e LGPD.
- Fluxo de mobilidade elétrica com wallbox residencial, condomínio, empresa/frota, eletroposto, integração solar, quantidade de veículos, momento de compra, cidade, UF, contato e LGPD.
- Opção "Outro objetivo" com descrição breve obrigatória.
- Busca automática por empresas cadastradas ao final da captura.

### Empresas e reviews
- Busca final considera cidade, estado e categoria extraída da necessidade selecionada.
- Cards reutilizam reviews recentes anexados pelo backend e exibem CTA "Ler reviews".
- Estado de ausência de empresas passou a atender ambas as verticais.

### Persistência e contratos
- Resposta de `POST /api/v1/chat/leads` agora inclui `success` e `lead_id`.
- Sessão retorna `vertical` e `message_count`.
- Respostas guiadas são mantidas em `chat_leads.metadata` e sincronizadas para `leads.wizard_answers`.
- Hook do frontend usa UTMs do último toque e envia o parâmetro correto no feedback.

## Verificação

### Executado com sucesso
- `git diff --check`
- Transpilação TypeScript focada dos arquivos tocados
- Jest focado: `ChatLeadQualificationWizard.test.tsx` e `ChatCompanyRecommendations.test.tsx`
- Resultado Jest: `8 passed`

### Limitações locais registradas
- `next build` não concluiu: o ambiente local não conseguiu baixar fontes Inter de `fonts.gstatic.com`; o Next também tentou corrigir dependências SWC ausentes no lockfile.
- `tsc --noEmit` global continua falhando por erros preexistentes fora desta entrega, principalmente declarações ausentes de `lucide-react`.
- Specs Rails foram adicionados, mas não executados porque Ruby/Bundler não estão instalados no runtime WSL atual.
