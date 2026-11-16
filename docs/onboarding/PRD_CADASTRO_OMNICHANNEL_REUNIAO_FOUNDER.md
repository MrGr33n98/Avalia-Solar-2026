# PRD — Cadastro omnichannel B2B + reunião com fundador (Avalia Solar)

**Versão:** 1.0 | **Data:** 2026-11-16 | **Status:** proposta / implementação incremental na branch do PR #136.
**Produto:** marketplace Avalia Solar, aplicativo web/PWA e número oficial do WhatsApp via WAHA.
**Escopo:** aquisição e ativação de integradores. Este documento NÃO autoriza deploy, migrações ou ativação automática de flags.

## 1. Decisão de produto

Manter **duas jornadas reais e independentes** de cadastro:
- **WhatsApp:** início pela palavra-chave `CADASTRAR`, formulário conversacional existente (`B2b::OnboardingSessionService`).
- **App/web/PWA:** formulário existente em `/register-company`, com etapas "Dados da empresa" e "Responsável e contato".

As jornadas devem convergir em um **mesmo modelo de titularidade, análise, aprovação e ativação**, sem exigir que o interessado troque de canal e sem antecipar permissões. **Convite para uma conversa de 15 minutos com o fundador** disponível após cadastro recebido, em ambas as jornadas, inclusive enquanto a análise está pendente. A conversa é **opcional**, não altera aprovação, assinatura, ranking, selo nem direito de acesso.

**Objetivo de negócio:** aumentar cadastros qualificados, reuniões realizadas, empresas aprovadas e conversão comercial, sem venda de leads e sem comprometer LGPD e RBAC.

## 2. Inventário AS-IS validado

| Área | Código existente | Evidência / lacuna |
|---|---|---|
| Entrada WhatsApp | `AB0-1-front/components/CompanyRegistrationTicker.tsx` | CTA do ticker envia `CADASTRAR` para número oficial. |
| Cadastro WA | `AB0-1-back/app/services/b2b/onboarding_session_service.rb` | PR #136 cria Company pending, claim pending e remove mensagem de agendamento. |
| Cadastro app | `AB0-1-front/app/register-company/page.tsx` | Wizard 2 etapas, tela final com status de análise, sem convite para reunião. |
| API app | `AB0-1-back/app/controllers/api/v1/companies_controller.rb#create` | Empresa pendente + moderação pending_review, mas cria CompanyMember owner com status padrão **active**; P0 revisar permissões e transições antes de afirmar paridade com WA. |
| Aprovação app | `AB0-1-back/app/admin/companies.rb` | Fluxo de aprovação direta da empresa e usuário separado do fluxo de `CompanyAccessRequest`. |
| Aprovação WA | `CompanyAccessRequest` / `CompanyClaims::DecideRequest` | PR #136 exige aprovação administrativa e confirmação de email antes de efetivar titularidade. |
| Agendamento | `CompanyMailer` e modelos comerciais | Já usam Zoho Bookings, inclusive link de onboarding de 15 minutos. |
| Dados de CRM | `docs/crm/WHATSAPP_CRM_FOUNDATION_IMPLEMENTATION.md` | WAHA CRM metadata-only é feature-flagged, desativado por padrão; não confundir com cadastro WhatsApp. |

**P0 acesso ao cadastro app:** o endpoint `POST /api/v1/companies` exige autenticação. O `AuthController#register` cria usuários `company` como `pending`, e `AuthController#login` bloqueia usuário pending. Validar a rota real de entrada de **novo integrador** (criar conta → aprovação/confirmar email → formulário) para evitar jornada circular em que não se pode cadastrar a empresa antes de ativar a conta. Não anunciar cadastro app anônimo sem implementar fluxo seguro específico.

**P0 segurança:** o membro owner do app nasce ativo pelo valor default em `CompanyMember`. Uma empresa pending pode continuar inacessível por outras verificações, mas **não basta inferir segurança a partir do status da empresa**. Verificar `CompanyMember`, `User`, `Pundit`, consultas a `active_member_companies`, endpoints de edição e ação do ActiveAdmin. O PR não deve ser aprovado sem contrato explícito e testes de autorização em ambos os canais.

## 3. Personas e necessidades

1. **Integrador pequeno / decisor:** quer cadastro rápido e orientação humana, sem preencher tudo duas vezes.
2. **Gerente / colaborador:** informa dados, mas não deve receber acesso de proprietário sem prova de titularidade.
3. **Time interno de Growth/Founder:** precisa abordar opt-in, qualificar interesse e organizar reunião.
4. **Trust & Safety/Admin:** verifica identidade, e-mail, CNPJ, duplicidade e concede acesso auditável.
5. **Integrador já cadastrado:** deve **reivindicar** o perfil existente, nunca criar outro Company por engano.

## 4. User journeys TO-BE

### A. WhatsApp (conversacional, não descontinuar)
1. Descoberta no ticker/landing/outbound → CTA "Cadastrar pelo WhatsApp" → usuário envia `CADASTRAR`.
2. WAHA inicia ou retoma sessão de onboarding; solicita CNPJ, confere cadastro existente, explica os dados requeridos.
3. Captura nome, email corporativo verossímil, atuação, categoria, cobertura e mídia opcional; valida cada etapa e permite `VOLTAR`, `PULAR`, `CANCELAR`.
4. Se CNPJ existente → orientar **reivindicação**, sem duplicar empresa ou sobrescrever senha. Caso novo → Company pending, claim pending, User pending quando aplicável.
5. Confirma "Cadastro recebido para análise" sem prometer acesso, selo ou verificação.
6. **Mensagem separada e opcional**: "Converse 15 minutos com o fundador" via Zoho Bookings; alternativa: responder pelo WhatsApp com horário.
7. Admin avalia a solicitação; usuário confirma e-mail; somente após ambos ocorre ativação da titularidade.
8. Usuário acessa app/painel; completar perfil; acompanhar benefícios e planos.

### B. App/web/PWA (formulário, não substituir por WhatsApp)
1. Entrar por `/register-company` (desktop, mobile ou PWA), inclusive `/select-company`.
2. Etapa 1: dados da empresa / CNPJ / localização / categorias. Etapa 2: responsável / função / email / telefone / declaração.
3. Verificar CNPJ duplicado antes da criação; se existente, direcionar à reivindicação de perfil, preservando dados preenchidos sempre que possível.
4. Submit idempotente com Company pending + solicitação de titularidade pending; **não ativar CompanyMember nem User prematuramente**.
5. Tela final: "Cadastro recebido para análise" + estado pendente + 3 próximos passos.
6. **CTA opcional separado** "Agendar conversa de 15 minutos" abre Zoho Bookings em nova aba, sem bloquear "Acompanhar solicitação" ou "Voltar".
7. Admin e e-mail verificado; acesso ao painel somente após ambos; usuário acompanha status sem status falso de "aprovado".
8. Completar Brand Page, catálogo, serviços e considerar upgrade via funil de vendas.

### C. Duas jornadas, mesma empresa
- Empresa reconhecida por CNPJ normalizado; números divergentes / dados suspeitos não devem vincular automaticamente.
- Mesma conta de e-mail pode existir: fluxo autenticado, reivindicação formal e/ou verificação, sem sobrescrever credenciais.
- Login/app não é condição para concluir o cadastro por WhatsApp e vice-versa.
- Iniciar pelos dois canais não cria dois Company ativos nem dois owners sem avaliação.
- Reunião pode ocorrer antes da aprovação, sem atuar como atalho de privilégios.

### D. Erros e recuperação
- CNPJ inválido/inexistente → feedback no canal original; sem criar Company.
- CNPJ existente → mostrar opção de reivindicar.
- E-mail inválido/não confirmado → manter pendente; permitir reenvio autenticado com limite.
- WAHA fora do ar → oferecer caminho do app, sem criar cadastro fantasma.
- App/API indisponível → manter inputs; não mostrar sucesso sem 201 real.
- Zoho indisponível → CTA de agendamento opcional sem impactar submit; fallback contato humano; logs sem dados pessoais.
- Duplicação/retry do webhook → processamento idempotente.
- Admin rejeita → motivo claro, auditoria e caminho de regularização; nenhum acesso liberado.

## 5. Requisitos funcionais

| ID | Prioridade | Requisito | Critério de aceite |
|---|---|---|---|
| FR-01 | P0 | Preservar entradas WhatsApp e app | Ambas acessíveis nos breakpoints e com CTA correto. |
| FR-02 | P0 | Confirmação de cadastro verídica | Nenhum canal diz "aprovado" ou "painel liberado" antes de aprovação. |
| FR-03 | P0 | Convite founder na confirmação WA | Enviado após transação válida, separadamente, agendamento de 15 min; nunca substituir mensagem transacional. |
| FR-04 | P0 | Convite founder após submit app | CTA externo acessível, `target=_blank`, `rel=noopener noreferrer`, com texto opcional. |
| FR-05 | P0 | Aprovação e e-mail obrigatórios | Confirmação via email + decisão administrativa antes de ownership efetiva, para ambas as jornadas. |
| FR-06 | P0 | Não duplicar empresa/owner | Idempotência por CNPJ e claim por usuário/empresa; sem escalada de privilégio. |
| FR-07 | P0 | Reivindicação de empresa | CNPJ existente não cria empresa concorrente ou ignora titularidade. |
| FR-08 | P0 | Falha de Zoho isolada | Cadastro nunca depende de abrir link ou de webhook comercial. |
| FR-09 | P1 | Analytics por origem | `source_channel=whatsapp|app`, `source_surface`, correlation_id sem telefone/e-mail bruto. |
| FR-10 | P1 | Tracking de booking | Clique medido; reunião confirmada apenas com confirmação Zoho, nunca pelo clique. |
| FR-11 | P1 | Acompanhamento de status | Status pending/approved/rejected/unconfirmed com mensagens adequadas, sem revelar PII de terceiros. |
| FR-12 | P2 | Handoff entre canais | Link seguro com sessão autenticada / token expira; não expor CNPJ/email em query string. |

### Copy aprovada nesta fase
- WhatsApp: **"Cadastro recebido para análise!"** + "O acesso será liberado apenas após aprovação e confirmação do e-mail."
- WhatsApp: **"Sou o Felipe, fundador do Avalia Solar. Podemos conversar por 15 minutos enquanto sua solicitação é analisada? Agende aqui: [link]. É opcional e não substitui a verificação."**
- App: **"Cadastro recebido para análise"** + "Agendar conversa de 15 minutos com o fundador" + "Opcional; seu cadastro segue em análise."
- Não usar: "Selo de Empresa Verificada garantido", "Já pode acessar", "Seu cadastro está aprovado" antes da decisão.

## 6. Especificação técnica e DDD

**Agregados existentes:** Company, CompanyAccessRequest, User, CompanyMember, CompanyOnboardingSession. O vínculo e-mail/claim não deve ser fabricado nem ativado a partir do número WhatsApp. Cadastro app usa `companies#create`; WA usa `B2b::OnboardingSessionService`. **Convergência de domínio será implementação posterior**, de preferência via serviço transacional compartilhado (ex.: `Companies::RegisterPendingCompany`) com duas adaptadoras por canal. Não criar nova camada paralela à existente sem migração de contratos.

**Estados propostos:** `draft` → `submitted/pending_review` → `admin_approved, email_unconfirmed` (ou ordem inversa) → `activated` / `rejected`. O estado de reunião (`not_offered|offered|clicked|booked|attended|no_show`) é **ortogonal**: nunca libera o acesso. Não alterar schema nessa primeira entrega de CTA.

**Zoho:** link de onboarding de 15 min já presente no repositório:
`https://avaliasolar.zohobookings.com/5012013000000038009/#/5012013000000038009?bookedFrom=ShortenURL`.
Para backend, variável opcional `B2B_ONBOARDING_BOOKING_URL` com fallback à URL existente; para frontend `NEXT_PUBLIC_B2B_ONBOARDING_BOOKING_URL` com o mesmo fallback. Configuração/segredos nunca fornecidos pelo usuário final.

**Contratos:** não modificar endpoints de cadastro durante a primeira entrega do CTA. Tracking usa contrato `cta_click` já existente no frontend. Eventos propostos devem passar por registro/allowlist/schema e dedupe antes de uso em produção.

## 7. KPIs, definições e metas (hipóteses, não baselines aferidas)

| KPI | Definição | Meta experimental inicial |
|---|---|---|
| Cadastro concluído por canal | submits válidos / inícios únicos | **WhatsApp ≥35%; app ≥25%** em coortes elegíveis |
| Conclusão de cadastro sem duplicidade | cadastros únicos por CNPJ / submits concluídos | **≥99%** |
| CTR do convite de reunião | cliques Zoho / telas de confirmação exibidas ou mensagens entregues | **≥15%** |
| Agendamento confirmado | reservas confirmadas no Zoho / cadastros válidos | **≥8%** (não estimar a partir do clique) |
| Comparecimento | reuniões realizadas / reservas confirmadas | **≥70%** |
| Tempo para primeira resposta humana | p50/p90 entre cadastro e primeiro contato | **p50 ≤1 dia útil; p90 ≤2 dias úteis** |
| Prazo de moderação | tempo entre submit e decisão | **≥90% decididos em até 2 dias úteis** |
| Verificação de e-mail | confirmados / convidados válidos | **≥60% em 7 dias** |
| Ativação segura | empresas ativadas após dois pré-requisitos / ativações totais | **100%** |
| Conversão comercial D30 | empresas que aderem ao pago até D30 / aprovadas únicas | **meta a calibrar após baseline** |
| Privacy/security | vazamentos cross-tenant, grants indevidos, dados sensíveis em payloads | **zero tolerância** |

**Regras de medida:** separar fontes `whatsapp` e `app`, tráfego orgânico/outbound, device e tipo de empresa. Coorte por submit (timezone America/Sao_Paulo). Não misturar "cadastro recebido", "empresa aprovada", "reunião clicada", "reunião confirmada" e "plano pago". Deduplicar com event_id e company_id interno, sem PII. Medir baseline nas primeiras 2 semanas, revisão em D14 e D30. Metas acima são hipóteses para validação, não métricas atuais.

**Funil mínimo (instrumentação proposta):**
`registration_entry_viewed` → `registration_started` → `registration_submitted` → `booking_cta_viewed` → `booking_cta_clicked` → `booking_confirmed` → `meeting_attended` → `company_approved` → `email_confirmed` → `owner_activated` → `paid_subscription_started`.
Não emitir eventos novos antes de atualizar contrato/allowlist do pipeline. `booking_confirmed` requer evento confiável de Zoho ou conciliação manual; clique não é booking.

## 8. User stories e critérios de aceite (Given/When/Then)

- **US-01 [P0]** Como integrador, quero cadastrar via WhatsApp sem usar app. Dado CNPJ novo, email válido e etapas concluídas, quando submeto, então empresa e claim ficam pending; recebo confirmação e convite opcional de 15 min.
- **US-02 [P0]** Como integrador, quero cadastrar pelo app sem ser obrigado a abrir WhatsApp. Dado formulário válido, quando submeto, então vejo "Cadastro recebido para análise", recebo retorno pelo app/e-mail e posso abrir o Zoho voluntariamente.
- **US-03 [P0]** Como visitante, quero entender que reunião não é requisito. Dada a confirmação, quando ignoro o link, então a solicitação segue normal.
- **US-04 [P0]** Como proprietário legítimo, quero acesso seguro. Dada aprovação apenas administrativa, quando o e-mail ainda não foi confirmado, então não tenho owner ativo; dado os dois pré-requisitos, então recebo owner autorizado.
- **US-05 [P0]** Como terceiro sem titularidade, não quero tomar controle de empresa. Dado e-mail arbitrário ou CNPJ existente, quando tento reivindicar, então não altero senha nem ownership sem validação.
- **US-06 [P1]** Como fundador, quero medir reuniões agendadas por canal. Dado clique no convite, quando abre Zoho, então o clique é medido com origem; confirmação só ocorre após evidência da agenda.
- **US-07 [P1]** Como suporte, quero recuperar cadastros incompletos. Dada queda de WAHA/erro API, quando o canal volta, então não duplico cadastro, nem envio convites repetidos.
- **US-08 [P1]** Como PM, quero acompanhar conversão por coortes. Dados eventos deduplicados e permissão de análise, quando filtro canal, então consigo taxas de submit→meeting→approved→paid.

## 9. Task list implementável (dependências, fases e owners por função)

| Task | Pri | Owner | Entrega objetiva |
|---|---|---|---|
| T-01 | P0 | BE | Restaurar mensagem **separada** com agenda founder após cadastro WhatsApp válido; copy sem promessa de ativação; fallback URL existente. |
| T-02 | P0 | FE | Adicionar CTA de agenda à tela final de `/register-company`, em desktop/PWA/mobile, sem remover acompanhamento de status. |
| T-03 | P0 | FE/BE | Diferenciar "enviado/pendente" de "aprovado/ativo" nas mensagens e telas. |
| T-04 | P0 | QA | Specs para convite após sucesso e ausência de convite em erros; validação de copy, url e não regressão do pending. |
| T-05 | P0 | Security/BE | Auditar `companies#create`: owner active default, aprovação ActiveAdmin, email confirmation, claims e autorizações Pundit. Especificar transição única e corrigir sem impactar usuários existentes. |
| T-06 | P0 | BE | Idempotência/reivindicação para CNPJ já existente em WA e app; teste de submit duplo/race/webhook replay. |
| T-07 | P0 | BE/QA | Testes de usuário não confirmado, admin não aprovado, conta existente, tentativas cross-tenant, company pending, bypass de rotas. |
| T-08 | P1 | Analytics | Mapear `company_created`, `company_registered`, `cta_click` existentes; instituir nomenclatura única e contratos dos eventos novos. |
| T-09 | P1 | RevOps | Conciliação Zoho: booking/attended/no-show, source_channel; não contar clique como conversão. |
| T-10 | P1 | UX | Definir CTA de escolha entre cadastro app e WA nos entry points, sem substituir ticker e sem forçar canal. |
| T-11 | P1 | BE | Serviço compartilhado para registrar pendência / autorização e origem do cadastro, com migração reversível se necessária. |
| T-12 | P1 | QA | Teste E2E Playwright app e cenário contract WAHA fake gateway; 320, 390, 768, 1440 px. |
| T-13 | P1 | Privacy | Revisar base legal, consentimentos, prazo de retenção e telemetria sem PII. |
| T-14 | P2 | Growth | Jornada de 15-min follow-up com cadência consentida e suppression após booking/rejeição/opt-out. |
| T-15 | P2 | SRE | Dashboard de funil por canal, alerts e acompanhamento de regressão/rollbacks. |

**Fatiamento recomendado:** Fase A = T01-04 (CTA + mensagem sem schema/API). Fase B = T05-07 (P0 de segurança e unicidade; deve bloquear merge abrangente do PR #136). Fase C = T08-13 (instrumentação e convergência). Fase D = T14-15 (otimização comercial). Não liberar CRM WhatsApp metadata-only como efeito colateral do cadastro.

## 10. Suite de testes / TDD / gate de release

- **RSpec WA:** cadastro válido gera pending/claim e duas mensagens distintas (status e agendamento); inválido gera apenas erro; usuário existente mantém senha; claim não cria membro ativo; link pode ser desligado por configuração; repeat não multiplica entidades.
- **RSpec app:** POST companies com e sem auth, company pending; membro não autorizado não pode editar/gerir empresa; admin+email gating; CNPJ duplicado; concorrência; status rejeitado; alerta por e-mail sem credenciais.
- **Jest/RTL:** tela final app apresenta status real, CTA clicável, rel seguro, tracking `cta_click` e todos os botões existentes.
- **Playwright:** mobile 320/390, tablet 768, desktop 1440: sem overflow, teclado/foco visível, alvo CTA ≥44px, fluxo sem Zoho disponível continua íntegro.
- **WAHA fake gateway:** registra intenção/cadastro, não inventa conta, não envia convite em erro e não transforma avaliação de consumidor em lead.
- **Security:** permissões de usuário sem email validado; empresa de outro tenant; claim rejeitado; no PII in events; audit trail.
- **CI/CD:** lint, typecheck, RSpec full, smoke+E2E, migração em banco isolado (se aplicável), diff de `main`, checagem de conflito do PR e release SHA verificado.

**Critério para merge:** todos P0 de segurança resolvidos; CI verde; PR mergeable; documentação de flags e rollback; Zoho CTA isolado; sem side effects de billing/reviews/CRM; smoke no ambiente de teste.

## 11. Rollout, observabilidade e rollback

- **Fase A:** implantação de copy + CTA pode reverter arquivos `onboarding_session_service.rb` e `/register-company/page.tsx`; não depende de migração.
- **Fase B:** corrigir app ownership com teste de transições, preferencialmente em PR próprio com rollout controlado; não inverter status de membros ativos existentes indiscriminadamente.
- **Fase C:** instrumentação progressiva, amostragem e painel.
- Zoho: opcional, links devem ser validados por Product/RevOps antes de deploy, configurações não podem aceitar redirecionamento não confiável.
- WAHA CRM: `WHATSAPP_CRM_ENABLED=false` até checklist independente do CRM ser aprovado.
- Toda alteração em PR #136 deve ser revisada em relação à `main` após merge do #137 (copy de reviews já entregue). **Nunca dar merge forçado na main.**

## 12. Definition of Done (DoD)

[ ] As duas rotas de cadastro permanecem funcionais e acessíveis.
[ ] Cadastro recebido ≠ aprovado; reunião é voluntária.
[ ] Convite de 15 min reaparece no WA e na confirmação app.
[ ] Administração + email confirmados antes de owner efetivo nos dois canais.
[ ] Reivindicações e CNPJ duplicados não elevam privilégios.
[ ] Mensagens/landing não prometem selo ou plano pago.
[ ] Métricas por canal definidas; booking confirmado apenas por evidência.
[ ] Cobertura de QA com casos positivos/negativos, responsividade e regressões.
[ ] Migrações e flags auditadas; rollback documentado.
[ ] CI verde e PR sem conflitos, só então merge.

## 13. Decisões em aberto

1. Confirmar se o link Zoho de onboarding (ID 5012013000000038009) é a agenda de 15 minutos ativa.
2. Definir SLA operacional de análise e responsáveis por revisão de titularidade.
3. Estabelecer política de consentimento/opt-out para mensagens comerciais subsequentes.
4. Definir única política de criação de CompanyMember e User para cadastro app e WA; prioridade P0.
5. Definir atribuição entre WA → app sem tokens inseguros na URL.
