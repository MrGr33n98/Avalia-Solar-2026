# 05 — Histórias de Usuário & Critérios de Aceite (US-CRM-001 a US-CRM-048)

## EPIC E00 — Ground Truth, UI Inventory & Governança (P0)

### US-CRM-001: Auditoria Real do Repositório e Baseline
- **Como** Tech Lead do Avalia Solar,
- **Quero** inspecionar a árvore local de código sem fazer alterações destrutivas,
- **Para** conhecer com exatidão o estado real das rotas, controllers, schemas e componentes.
- **Given** o repositório Avalia Solar na branch `main`,
- **When** executo os comandos de auditoria do Gate A,
- **Then** confirmo arquivos existentes, scripts de teste e dependências ativas sem inventar dados.

### US-CRM-002: Matriz de Comportamento Web x PWA
- **Como** Design System Engineer,
- **Quero** uma matriz clara de comportamento para cada tela entre desktop (≥768px) e mobile (<768px),
- **Para** evitar duplicação de componentes ou quebras de viewport.
- **Given** componentes de CRM em `components/sales/`,
- **When** comparo o layout desktop com as diretrizes PWA,
- **Then** defino uso de sheets ≤ 70dvh, listas compactas e scroll controlado.

### US-CRM-003: Governança de Tokens Avalia Solar
- **Como** Product Designer,
- **Quero** que o CRM use unicamente os tokens da marca Avalia Solar (`brand.blue`, `brand.green`, `brand.navy`),
- **Para** manter coerência estética e identidade visual limpa.
- **Given** o arquivo `tailwind.config.ts`,
- **When** estilizo componentes do CRM,
- **Then** não introduzo fontes externas (IBM Plex, Doyle) ou cores não oficiais.

### US-CRM-004: Instrumentação de Release Gates e Rastreabilidade
- **Como** QA Lead,
- **Quero** rastrear cada GAP para sua User Story, Task e teste associado,
- **Para** assegurar que nenhuma alteração vá para staging sem evidência comprovada.
- **Given** a tabela de rastreabilidade em `15_TRACEABILITY.md`,
- **When** uma tarefa é declarada concluída,
- **Then** ela deve possuir commit e comando de teste documentado com resultado PASS.

---

## EPIC E01 — Shell & Navegação Responsivos (P0)

### US-CRM-005: Preservação da Navegação Desktop
- **Como** vendedor operando em tela grande (≥768px),
- **Quero** visualizar a sidebar `#0c102b` e topbar `#0c1a30` completas,
- **Para** navegar rapidamente pelas entidades do CRM com painéis side-by-side.
- **Given** usuário autenticado em viewport 1440x900 em `/dashboard/sales`,
- **When** visualizo o painel,
- **Then** a sidebar lateral está visível, a topbar exibe busca e criação, e a página não possui scroll horizontal.

### US-CRM-006: Navegação PWA com Barra Inferior e Header Compacto
- **Como** vendedor operando em smartphone (<768px),
- **Quero** um header compacto com botão de busca e uma barra inferior fixa de 5 destinos,
- **Para** acessar Hoje, Pipeline, Empresas, Tarefas e Mais confortavelmente com o polegar.
- **Given** viewport móvel 375x812 em `/dashboard/sales/**`,
- **When** acesso qualquer rota de vendas,
- **Then** vejo `CRMMobileBottomNav` fixo no rodapé respeitando `safe-area-inset-bottom` e o footer público do marketplace não é renderizado.

### US-CRM-007: Deep Linking e Navegação de Retorno
- **Como** vendedor acessando uma conta ou oportunidade via link direto,
- **Quero** clicar em "Voltar" e retornar à listagem com filtros e página preservados,
- **Para** não perder o contexto da minha pesquisa.
- **Given** navegação direta para `/dashboard/sales/accounts/42`,
- **When** toco no botão Voltar no header mobile,
- **Then** retorno para `/dashboard/sales/accounts` mantendo o scroll anterior.

### US-CRM-008: Acionador Global de Criação (+)
- **Como** vendedor em trânsito,
- **Quero** tocar no botão `+` em qualquer tela do CRM,
- **Para** registrar uma atividade, tarefa, oportunidade ou empresa sem navegar até a listagem.
- **Given** qualquer página do CRM aberta,
- **When** clico no botão Adicionar,
- **Then** o menu do `CRMGlobalCreateHost` é exibido com opções permitidas pelo meu perfil.

### US-CRM-009: Acessibilidade Teclado e Reduced-Motion
- **Como** usuário assistivo ou com preferência de movimento reduzido,
- **Quero** navegar pelos menus e modais usando tab/shift-tab e escape,
- **Para** operar o sistema sem armadilhas de foco.
- **Given** modal aberto no CRM,
- **When** pressiono Escape,
- **Then** o modal fecha e o foco retorna ao elemento acionador original.

---

## EPIC E02 — Hoje, Busca & Diretórios (P1)

### US-CRM-010: Fila do Dia (Hoje / Daily Queue)
- **Como** vendedor iniciando o expediente,
- **Quero** ver minhas tarefas atrasadas, atividades agendadas e oportunidades sem próxima ação,
- **Para** priorizar os contatos de maior valor sem dados simulados.
- **Given** resposta de `GET /api/v1/sales/today`,
- **When** abro `/dashboard/sales/today`,
- **Then** vejo indicadores verdadeiros do backend, com a primeira ação prioritária visível no topo da tela.

### US-CRM-011: Busca Global Contextual
- **Como** vendedor procurando um cliente ou oportunidade,
- **Quero** pesquisar por nome ou CNPJ via Ctrl+K ou ícone de busca,
- **Para** localizar o registro em menos de 300ms com isolamento estrito de tenant.
- **Given** termo digitado no `CRMCommandPalette`,
- **When** digito 3 caracteres,
- **Then** a requisição anterior é abortada, debounce de 300ms é aplicado e os resultados aparecem agrupados por tipo.

### US-CRM-012: Lista de Empresas Responsiva
- **Como** vendedor navegando pela carteira de contas,
- **Quero** ver cartões compactos no mobile e tabela expansível no desktop,
- **Para** filtrar por estágio de prospecção e abrir o perfil 360°.
- **Given** rota `/dashboard/sales/accounts`,
- **When** aplico filtros no drawer/sheet,
- **Then** a lista atualiza e os filtros selecionados aparecem destacados em chips.

### US-CRM-013: Lista de Contatos (Pessoas)
- **Como** vendedor procurando um interlocutor comercial,
- **Quero** visualizar cargos, telefones e empresas vinculadas,
- **Para** iniciar contato direto via tel: ou WhatsApp com um clique.
- **Given** listagem de contatos em `/dashboard/sales/people`,
- **When** clico no ícone de telefone,
- **Then** o discador nativo do dispositivo é acionado com número devidamente sanitizado.

### US-CRM-014: Fila de Prospecção (ICP Fit & Data Quality)
- **Como** closer comercial,
- **Quero** distinguir claramente entre completude cadastral (Data Quality) e aderência ao perfil ideal (ICP Fit),
- **Para** não confundir preenchimento de campos com probabilidade de conversão.
- **Given** visualização da fila em `ProspectingQueue.tsx`,
- **When** visualizo os badges,
- **Then** os rótulos indicam métricas calculadas pelo Rails sem scores fictícios.

---

## EPIC E03 — Visões 360° & Oportunidades (P1)

### US-CRM-015: Empresa 360° (Company360View)
- **Como** vendedor analisando uma conta,
- **Quero** ver histórico de interações, contatos associados e oportunidades abertas,
- **Para** ter contexto integral antes de uma ligação.
- **Given** conta existente com ID válido,
- **When** abro `/dashboard/sales/accounts/:id`,
- **Then** vejo header com status comercial, abas de detalhe e botão de acesso ao perfil público no marketplace.

### US-CRM-016: Contato 360° (Contact360View)
- **Como** vendedor em negociação com um tomador de decisão,
- **Quero** ver todas as empresas às quais o contato está vinculado e seu histórico de e-mails,
- **Para** falar com autoridade e pertinência.
- **Given** contato cadastrado em múltiplas empresas via `Sales::ContactEmployment`,
- **When** visualizo seu perfil,
- **Then** cada vínculo empregatício é respeitado e as permissões de escopo são mantidas.

### US-CRM-017: Oportunidade 360° (Opportunity360View)
- **Como** vendedor gerenciando um negócio,
- **Quero** visualizar valor total em BRL, probabilidade, estágio e tarefas pendentes,
- **Para** mover a negociação rumo ao fechamento.
- **Given** oportunidade aberta em `/dashboard/sales/opportunities/:id`,
- **When** visualizo o cockpit em tela móvel,
- **Then** o header com valor e estágio permanece fixo sem sobrepor o CTA de ação.

### US-CRM-018: Pipeline Board & Alternância de Visualização
- **Como** gestor comercial,
- **Quero** arrastar oportunidades entre estágios no desktop e mudar de estágio via sheet no mobile,
- **Para** atualizar negócios com agilidade em qualquer dispositivo.
- **Given** rota `/dashboard/sales/pipeline`,
- **When** opero em dispositivo touch,
- **Then** toco no seletor de estágio e escolho o próximo estágio sem depender de drag-and-drop horizontal.

### US-CRM-019: Transição Transacional de Estágio com Rollback
- **Como** vendedor movendo uma oportunidade de estágio,
- **Quero** que a mudança seja atômica no Rails com gravação em `Sales::StageHistory`,
- **Para** assegurar que falhas de rede restaurem o card imediatamente na coluna anterior.
- **Given** oportunidade sendo movida para "Proposta Apresentada",
- **When** a API retorna erro 422 ou 500,
- **Then** o card retorna à coluna original, toast de erro é exibido e nenhum ganho falso é registrado.

### US-CRM-020: Fechamento Ganho / Perdido com Motivo
- **Como** líder de vendas,
- **Quero** exigir motivo de perda ao marcar uma oportunidade como perdida,
- **Para** enriquecer os relatórios de perda e retroalimentar produto.
- **Given** oportunidade no estágio de negociação,
- **When** clico em "Marcar como Perdida",
- **Then** modal solicita o motivo obrigatório antes de disparar `POST /api/v1/sales/opportunities/:id/lost`.

---

## EPIC E04 — Atividades, Tarefas & Timeline (P0/P1)

### US-CRM-021: Registro de Chamada Telefônica Sem Falso Positivo (P0)
- **Como** vendedor pós-ligação,
- **Quero** registrar o desfecho, duração e notas da ligação no `CallLoggerModal`,
- **Para** ter certeza absoluta de que a chamada foi persistida no backend antes de fechar o modal.
- **Given** o `CallLoggerModal` aberto para um contato e empresa,
- **When** a API Rails responde 201 Created com `{ activity: { id: 123 } }`,
- **Then** o modal exibe sucesso e fecha; se a API retornar erro HTTP ou faltar `accountId`, o modal permanece aberto, o erro é exibido e as notas não são perdidas.

### US-CRM-022: Registro de Atividade Manual Padronizado (P0)
- **Como** vendedor registrando uma reunião ou nota interna,
- **Quero** preencher `CreateActivityModal` e salvar com payload tipado,
- **Para** atualizar a linha do tempo comercial.
- **Given** modal aberto via `CRMGlobalCreateHost` ou ficha 360°,
- **When** submeto o formulário,
- **Then** a requisição atinge endpoint válido no Rails, vincula a conta e atualiza a timeline.

### US-CRM-023: Criação e Conclusão de Tarefas
- **Como** vendedor organizando follow-ups,
- **Quero** criar uma tarefa com data de vencimento e prioridade,
- **Para** receber lembretes na fila do Hoje.
- **Given** formulário `CreateTaskModal`,
- **When** salvo a tarefa,
- **Then** ela é persistida em `sales_tasks` e renderizada na agenda.

### US-CRM-024: Timeline Unificada e Consistente
- **Como** vendedor revisando o histórico de um cliente,
- **Quero** ver e-mails, ligações, reuniões, tarefas e mudanças de estágio em ordem cronológica decrescente,
- **Para** entender a evolução do relacionamento.
- **Given** componente `UnifiedTimeline.tsx` carregado,
- **When** alterno filtros entre "Ligações", "E-mails" e "Tarefas",
- **Then** os eventos são filtrados sem duplicações e com rótulos em pt-BR.

### US-CRM-025: Atualizações em Tempo Real via ActionCable
- **Como** membro da equipe comercial,
- **Quero** receber novos eventos na timeline via WebSocket `SalesTimelineChannel`,
- **Para** não precisar atualizar manualmente a página durante negociações ativas.
- **Given** conexão ActionCable estabelecida,
- **When** outro usuário registra uma atividade na mesma conta,
- **Then** o evento surge na timeline deduplicado por ID estável.

### US-CRM-026: Sugestão de Próxima Melhor Ação (Next Best Action)
- **Como** vendedor com muitos contatos simultâneos,
- **Quero** ver recomendações contextuais baseadas em regras determinísticas do Rails,
- **Para** agir no momento certo sem dados alucinados.
- **Given** conta sem contato há mais de 7 dias,
- **When** visualizo o Hoje ou Empresa 360°,
- **Then** a recomendação exibe "Realizar follow-up por WhatsApp" com justificativa transparente.

---

## EPIC E05 — Voz & IA Opcional sob Feature Flag (P1)

### US-CRM-027: Captura de Áudio com Permissão Explícita
- **Como** vendedor gravando nota rápida por voz no PWA,
- **Quero** conceder permissão de microfone apenas após clicar em "Gravar",
- **Para** manter privacidade e controle sobre a captação de áudio.
- **Given** navegador móvel compatível com `MediaRecorder`,
- **When** clico em Gravar Nota,
- **Then** vejo contador de tempo, botão de Cancelar e opção de digitação manual a qualquer momento.

### US-CRM-028: Transcrição com Retenção Mínima
- **Como** encarregado de privacidade (DPO),
- **Quero** que arquivos de áudio sejam descartados após a extração textual,
- **Para** não armazenar biometria de voz desnecessariamente.
- **Given** upload de áudio concluído,
- **When** a transcrição é gerada,
- **Then** o áudio bruto não é mantido em armazenamento permanente e não é enviado a provedores não autorizados.

### US-CRM-029: Extração de Campos Tipada via Schema
- **Como** vendedor,
- **Quero** que a transcrição sugira campos (tipo de atividade, assunto, resumo, próxima data),
- **Para** acelerar o preenchimento da ficha.
- **Given** transcrição em português,
- **When** o extrator processa o texto,
- **Then** retorna campos estruturados validados por Zod no frontend e Rails no backend.

### US-CRM-030: Revisão Humana Obrigatória Antes de Salvar
- **Como** vendedor responsável pelo registro,
- **Quero** revisar e editar qualquer campo sugerido pela IA antes de salvar,
- **Para** impedir que alucinações entrem no histórico oficial da empresa.
- **Given** campos preenchidos pela IA,
- **When** visualizo a tela de revisão,
- **Then** nenhuma atividade, e-mail ou proposta é enviada automaticamente sem meu clique explícito em "Confirmar e Salvar".

### US-CRM-031: Resumo Comercial de Conta
- **Como** vendedor assumindo uma conta existente,
- **Quero** ler um resumo objetivo das últimas interações com menção explícita às fontes,
- **Para** preparar a abordagem em menos de 2 minutos.
- **Given** resumo IA habilitado,
- **When** abro o painel lateral da Empresa 360°,
- **Then** o resumo destaca apenas dados verificados no banco de dados.

---

## EPIC E06 — Propostas Comerciais & Planos (P1)

### US-CRM-032: Criação de Proposta sem Digitação de ID Manual
- **Como** closer comercial,
- **Quero** iniciar uma proposta a partir do card de oportunidade,
- **Para** que IDs de oportunidade e conta sejam vinculados automaticamente.
- **Given** oportunidade com ID 50 aberta,
- **When** clico em "Gerar Proposta",
- **Then** o formulário abre com a oportunidade pré-selecionada.

### US-CRM-033: Seleção de Plano e Validação de Preços no Backend
- **Como** vendedor negociando plano de assinatura do Avalia Solar,
- **Quero** escolher entre Essencial, Pro e Enterprise,
- **Para** emitir proposta com valores e benefícios vigentes.
- **Given** catálogo de planos atualizado no backend,
- **When** seleciono o plano Pro,
- **Then** o valor canônico (ex: R$ 1.500/ano) é carregado do backend sem hardcoding no cliente.

### US-CRM-034: Wizard PWA Acessível em Etapas Curtas
- **Como** vendedor emitindo proposta em tela móvel (<768px),
- **Quero** um wizard progressivo em até 4 passos (Dados → Plano → Condições → Revisão),
- **Para** não preencher formulários extensos em viewport reduzido.
- **Given** tela de proposta no PWA,
- **When** avanço as etapas,
- **Then** cada passo valida seus campos e exibe resumo sticky no rodapé.

### US-CRM-035: Visualização Prévia Segura do Documento
- **Como** vendedor e cliente,
- **Quero** visualizar o preview renderizado da proposta comercial via `QuoteRenderer`,
- **Para** conferir layout e condições antes da assinatura.
- **Given** proposta em status Rascunho,
- **When** clico em "Visualizar Documento",
- **Then** o HTML sanitizado é exibido sem vulnerabilidades de XSS ou vazamento de dados de outras contas.

### US-CRM-036: Envio e Ciclo de Vida Auditável da Proposta
- **Como** gestor comercial,
- **Quero** acompanhar o status real da proposta (Rascunho → Enviada → Aceita/Recusada),
- **Para** ter previsibilidade de receita no forecast.
- **Given** proposta enviada ao cliente,
- **When** o cliente formaliza o aceite,
- **Then** o evento de auditoria registra timestamp, usuário responsável e atualiza a projeção de vendas.

---

## EPIC E07 — Offline, Resiliência & Estados (P0/P1)

### US-CRM-037: Sinalização Clara de Conexão e Rede no PWA
- **Como** vendedor em área com instabilidade de sinal 4G/5G,
- **Quero** ver um indicador discreto de rede quando estiver offline,
- **Para** saber que os dados exibidos são os últimos em cache e evitar frustração.
- **Given** perda de conectividade com a internet,
- **When** navego pelas rotas do CRM,
- **Then** vejo badge "Modo Offline — Somente Leitura" sem simular falso salvamento.

### US-CRM-038: Limpeza de Cache no Logout e Isolamento Multi-tenant
- **Como** vendedor compartilhando computador ou dispositivo de teste,
- **Quero** que todos os caches em memória e IndexedDB sejam apagados no logout,
- **Para** impedir que o próximo usuário veja informações de outra conta ou tenant.
- **Given** usuário logado no CRM,
- **When** clica em Sair,
- **Then** `apiCache.clear()`, tokens e consultas em cache são purgados completamente.

### US-CRM-039: Política Contra Perda Silenciosa de Dados (Sem ConflictKey Destrutiva)
- **Como** vendedor que preencheu uma anotação extensa,
- **Quero** ser alertado se a requisição falhar por conflito de versão,
- **Para** não ter meu rascunho sobrescrito silenciosamente por outra ação.
- **Given** envio simultâneo ou conflito de concorrência,
- **When** a API retorna 409 Conflict,
- **Then** o formulário é preservado e recebo opção de mesclar ou reenviar.

### US-CRM-040: Retorno Online e Reconciliação
- **Como** vendedor reconectado à internet,
- **Quero** que os dados de Hoje e Pipeline sejam revalidados automaticamente,
- **Para** trabalhar com informações atualizadas.
- **Given** reconexão detectada pelo navegador,
- **When** o evento `online` dispara,
- **Then** o TanStack Query executa `refetchQueries` nos dados essenciais sem sobrecarregar o servidor.

### US-CRM-041: Proteção Contra Fechamento Acidental de Formulários Sujos (Dirty)
- **Como** vendedor preenchendo um resumo longo de reunião,
- **Quero** confirmação antes de fechar o modal por toque acidental no backdrop ou botão Voltar,
- **Para** não perder o texto já digitado.
- **Given** formulário com campos preenchidos e não salvos,
- **When** toco fora do modal ou pressiono Voltar,
- **Then** um diálogo de confirmação pergunta: "Deseja descartar as alterações não salvas?".

---

## EPIC E08 — Relatórios, Qualidade & Release (P1/P2)

### US-CRM-042: Relatórios Comerciais Baseados em Dados Reais
- **Como** diretor comercial,
- **Quero** visualizar relatórios de funil, taxas de conversão e receita anual recorrente estimada,
- **Para** tomar decisões estratégicas sem métricas fictícias.
- **Given** rota `/dashboard/sales/reports`,
- **When** seleciono o período "Últimos 30 dias",
- **Then** os números refletem exatamente as oportunidades fechadas no banco de dados.

### US-CRM-043: Telemetria Sem Vazamento de Dados Pessoais (PII)
- **Como** encarregado de conformidade e segurança,
- **Quero** que os eventos disparados para PostHog/Sentry omitam nomes, e-mails, telefones e notas,
- **Para** respeitar rigorosamente a LGPD e o princípio da minimização.
- **Given** qualquer ação comercial executada no CRM,
- **When** o evento de telemetria é despachado,
- **Then** contém apenas `screen`, `form_factor`, `status` e métricas técnicas sem PII.

### US-CRM-044: Cobertura E2E Playwright de Rotas e Viewports
- **Como** engenheiro de QA,
- **Quero** testes ponta a ponta cobrindo desktop (1440px), tablet (768px) e PWA móvel (375px/320px),
- **Para** assegurar que novos deploys não quebrem a usabilidade em nenhum dispositivo.
- **Given** suíte de testes Playwright,
- **When** executo os testes de regressão,
- **Then** todos os fluxos de criação e navegação passam com 100% de sucesso.

### US-CRM-045: Testes de Autorização e Isolamento de Escopo no Rails
- **Como** engenheiro de segurança,
- **Quero** specs RSpec validando que o usuário do Tenant A não pode visualizar ou alterar contas do Tenant B,
- **Para** garantir que a autorização é estritamente validada no backend.
- **Given** tentativa de `GET /api/v1/sales/accounts/:id_de_outro_tenant`,
- **When** a requisição é processada por `Sales::TenantScope`,
- **Then** o Rails responde 404 Not Found ou 403 Forbidden sem vazar metadados.

### US-CRM-046: Orçamento de Performance e Acessibilidade (Budgets)
- **Como** Staff Frontend Engineer,
- **Quero** que as páginas do CRM carreguem em menos de 1.5s em conexões 4G típicas,
- **Para** garantir agilidade e produtividade no uso cotidiano.
- **Given** auditoria Lighthouse / Core Web Vitals,
- **When** medido o LCP e CLS em mobile,
- **Then** o LCP permanece abaixo de 2.0s e o CLS abaixo de 0.1 sem layout shifts incômodos.

### US-CRM-047: Documentação de Rollback e Feature Flags
- **Como** Release Manager,
- **Quero** procedimentos documentados para reversão rápida de qualquer funcionalidade sob flag,
- **Para** desativar recursos com segurança caso surja anomalia em ambiente de homologação.
- **Given** documentação em `13_RELEASE_GATES.md`,
- **When** acionado o plano de contingência,
- **Then** a desativação da flag restaura o comportamento prévio imediatamente.

### US-CRM-048: Inventário e Paridade com Aplicativo Nativo Expo
- **Como** Mobile Lead,
- **Quero** documentar a relação entre o PWA Next.js e o app Expo existente em `AB0-1-mobile/`,
- **Para** manter a consistência de domínio sem duplicar desnecessariamente o desenvolvimento de um segundo CRM nativo.
- **Given** arquitetura PWA-first adotada oficialmente no MADR-001,
- **When** avalio o app Expo,
- **Then** registro ADR de paridade mantendo o app focado na jornada do consumidor e o PWA na operação comercial interna.
