# DOCUMENTO DE REQUISITOS (PRD), DESIGN SYSTEM, BACKLOG E CRITÉRIOS DE ACEITE POR ARQUIVO
## CRM AVALIA SOLAR — ESPECIFICAÇÃO DE ENGENHARIA DE PRODUTO E DESIGN DE ALTA FIDELIDADE
**Autor:** Principal Software Architect, Staff Product Designer & QA Lead  
**Data:** 2026-09-02  
**Status:** PRONTO PARA DESENVOLVIMENTO (READY FOR DEV)  

---

## INTRODUÇÃO E DIRETRIZES DA DOCUMENTAÇÃO
Este documento especifica a engenharia reversa completa do CRM, mapeando individualmente cada um dos **arquivos de dados (.csv)** e **imagens (.png)** contidos nas fontes da aplicação. 

Para cada arquivo, este blueprint estabelece:
1. **Product Requirements Document (PRD)**: A visão do produto, escopo e proposta de valor para o Avalia Solar.
2. **Design System & UI/UX Task List**: Classes utilitárias Tailwind CSS, tokens visuais, dimensões, estados e tarefas para implementação frontend.
3. **User Stories com Story Points**: Estimativa ágil baseada na escala Fibonacci (1, 2, 3, 5, 8, 13).
4. **Critérios de Aceite (BDD - Gherkin)**: Cenários Dado-Quando-Então para cobertura total de qualidade (QA).
5. **Componentes React**: Estrutura de código modular, propriedades (`Props`) e estados internos.
6. **Comportamento Esperado & Tratamento de Erros**: Respostas do sistema, transições de estado, chamadas de API e estratégias de *Optimistic UI* ou *Rollback*.

---

## SEÇÃO A: ARQUIVOS DE DADOS (CSVs)

### 1. `Accounts.csv` (Entidade de Contas/Empresas B2B)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Modelar e gerenciar organizações B2B, parceiros comerciais, integradores e canais de vendas. No setor de energia solar, as Contas são cruciais para mapear clientes PJ (como indústrias, comércios e cooperativas agropecuárias) que possuem faturas de alta tensão (Grupo A) ou frotas de telhados para geração distribuída.
*   **Campos Reais do Domínio**: `id`, `name`, `legacy_id`, `phone_phones`, `home_phones`, `mobile_phones`, `work_phones`, `fax_phones`, `other_phones`, `email`, `url`, `industry`, `accountType`, `contacts`, `contact`, `territory`, `owner`, `tags`, `address_1`, `address_2`, `address_3`, `city`, `state`, `postalCode`, `country`.
*   **Regra de Negócio Crítica**: Uma Conta pode possuir múltiplos Contatos vinculados (relação 1-para-M), mas deve possuir um "Contato Principal" (`contact`) associado para comunicações rápidas. A deleção de uma Conta deve executar soft-delete ou restrição caso existam Oportunidades (`Leads`) ativas vinculadas.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Background de Linha: `bg-white hover:bg-slate-50 transition-colors duration-150`. Badge de `accountType`: `bg-teal-50 text-teal-800 text-xs px-2 py-0.5 rounded-full font-semibold border border-teal-200`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Implementar a tabela responsiva de visualização de Contas (`AccountsTable`) com paginação e cabeçalho fixo (*sticky*).
    2. [ ] Criar badge de status e classificação (ex: "Customer", "Partner") com cores contrastantes.
    3. [ ] Criar hover card de detalhes rápidos de contatos associados.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Gerente de Contas RevOps,  
    > **Quero** visualizar e gerenciar os dados cadastrais completos das empresas clientes,  
    > **Para** que eu possa estruturar propostas comerciais corporativas personalizadas baseadas no segmento industrial e localização da fábrica.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Filtro de Contas por tipo de conta (Account Type)
      Dado que o usuário está na tela de listagem de Contas B2B
      Quando ele seleciona o filtro "accountType" com o valor "Customer"
      Então a tabela deve recarregar exibindo apenas as linhas onde accountType seja igual a Customer
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface AccountRowProps {
      account: {
        id: string;
        name: string;
        email?: string;
        accountType: string;
        industry?: string;
        city?: string;
        state?: string;
      };
      onSelect: (id: string) => void;
    }
    export const AccountRow: React.FC<AccountRowProps> = ({ account, onSelect }) => { ... };
    ```
*   **Comportamento & Erros**: Ao clicar em uma linha, transicionar dinamicamente para o painel de detalhes da empresa (`/accounts/:id`). Se houver falha de rede ao carregar a listagem, exibir estado de erro (`EmptyState` com botão de re-tentativa) preservando a barra de navegação principal.

---

### 2. `Activities.csv` (Registro de Interações e Atividades do Time de Vendas)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Rastrear e gerenciar tarefas, telefonemas, visitas técnicas (vistoria de sombreamento de telhado) e reuniões agendadas com os leads. É a ferramenta central para auditoria de produtividade do time comercial (vendedores de campo e SDRs).
*   **Campos Reais do Domínio**: `id`, `name`, `type`, `status`, `start_time`, `end_time`, `is_all_day`, `is_flagged`, `is_timed`, `description`, `participants`, `leads`, `creator`, `created_time`, `note`, `follow_up_activity_id`.
*   **Regra de Negócio Crítica**: O encerramento de uma atividade com status "Logged" (Concluída) deve sugerir automaticamente a criação de uma atividade de acompanhamento ("follow-up") via `follow_up_activity_id`, garantindo que nenhum lead de energia solar fique sem o próximo ponto de contato agendado (*Next Action Aging Policy*).

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Borda de Destaque: `border-l-4`. Cores por Tipo de Atividade: "Phone Call" -> `border-sky-500 bg-sky-50/50`; "Meeting" -> `border-emerald-500 bg-emerald-50/50`; "Technical Visit" -> `border-amber-500 bg-amber-50/50`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Implementar o componente `ActivityItem` para exibição na timeline de detalhes do cliente.
    2. [ ] Desenvolver indicador visual em formato de estrela/flag (`is_flagged`) com toggle reativo.
    3. [ ] Criar modal simplificado de conclusão rápida de chamada com campo para notas de encerramento.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** SDR / Vendedor Solar,  
    > **Quero** agendar e registrar o resultado de uma ligação de qualificação técnica de telhado,  
    > **Para** que o engenheiro de projetos tenha acesso às restrições do cliente antes de elaborar a proposta fotovoltaica.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Marcar atividade como concluída e sugerir follow-up
      Dado que o usuário tem uma atividade agendada com o status "Scheduled"
      Quando ele clica no checkbox para marcar como "Logged"
      Então o sistema deve exibir um popover perguntando se deseja agendar o próximo contato ("Follow-up")
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface ActivityItemProps {
      activity: {
        id: string;
        name: string;
        type: string;
        status: string;
        start_time: string;
        description?: string;
        is_flagged: boolean;
      };
      onToggleFlag: (id: string) => Promise<void>;
      onMarkCompleted: (id: string, notes: string) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Tratamento otimista ao alternar a flag (`is_flagged`). Se a API falhar no salvamento, reverter a estrela do indicador para o estado visual anterior (*rollback*) e disparar uma notificação flutuante toast contendo a mensagem de erro da API.

---

### 3. `Contacts.csv` (Contatos/Pessoas Físicas - Decision Makers)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Cadastro unificado de pessoas físicas com quem o time comercial se comunica diretamente (Diretores Financeiros, Gerentes de Operações, Proprietários Residenciais).
*   **Campos Reais do Domínio**: `id`, `name`, `legacy_id`, `phone_phones`, `home_phones`, `mobile_phones`, `work_phones`, `fax_phones`, `other_phones`, `email`, `url`, `accounts`, `territory`, `owner`, `tags`, `address_1`, `address_2`, `address_3`, `city`, `state`, `postalCode`, `country`, `job_title`.
*   **Regra de Negócio Crítica**: O campo `accounts` conecta o Contato à sua respectiva empresa. Contatos devem possuir validação estrita de formato de e-mail e telefone celular de acordo com o padrão internacional para viabilizar disparos diretos de e-mails de acompanhamento e integrações futuras com WhatsApp.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Tipografia de Nome: `font-bold text-slate-800 tracking-tight`. Avatar do Contato: `bg-gradient-to-tr from-slate-700 to-slate-900 text-white rounded-full flex items-center justify-center font-bold`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Implementar a tabela de listagem de Pessoas (`ContactsTable`) com pesquisa em tempo real por nome, cargo ou e-mail.
    2. [ ] Criar hover card de visualização compacta (`ContactHoverCard`) exibindo telefones úteis e link rápido de WhatsApp.
    3. [ ] Criar layout de formulário com seções dedicadas para Endereço, Informações Corporativas e Telefones.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Vendedor B2B,  
    > **Quero** acessar o perfil de um contato e identificar rapidamente seu cargo (`job_title`) e telefones,  
    > **Para** que eu possa ligar diretamente para o tomador de decisão técnica sobre o investimento na usina fotovoltaica.  
    *   **Pontuação Estimada (Story Points)**: **3 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Busca de contato por múltiplos campos de texto
      Dado que o usuário está na listagem de contatos
      Quando ele insere o termo "jlee@example.com" no campo de busca global
      Então a tabela deve filtrar instantaneamente para mostrar apenas o contato Jamie Lee
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface ContactCardProps {
      contact: {
        id: string;
        name: string;
        job_title?: string;
        email?: string;
        mobile_phones?: string;
        accounts?: string;
      };
      onEdit: (id: string) => void;
    }
    ```
*   **Comportamento & Erros**: Ao digitar na busca, utilizar a técnica de *debounce* de 300ms no lado do cliente para reduzir chamadas de API desnecessárias. Se a rede estiver offline, alertar o usuário através de um banner de status na tabela de contatos.

---

### 4. `Emails.csv` (Registro Histórico de Comunicação de E-mails)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Centralizar a caixa de correspondência eletrônica trocada com os contatos, proporcionando visibilidade completa de mensagens para qualquer membro do time comercial que assuma o lead.
*   **Campos Reais do Domínio**: `id`, `subject`, `headers`, `body`, `sent_time`, `created_time`, `zendesk_ticket_id`, `lead_ids`, `contact_ids`, `account_ids`, `user_ids`, `first_contact_legacy_id`.
*   **Regra de Negócio Crítica**: Um e-mail pode estar vinculado simultaneamente a múltiplos Leads, Contatos e Contas (relações polimórficas). O corpo do e-mail (`body`) deve suportar renderização em formato HTML de forma segura contra ataques de injeção de scripts (XSS).

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Ícone de E-mail: `text-sky-500 bg-sky-50 border border-sky-100 rounded-lg p-2`. Sombra do Bloco de Timeline: `shadow-sm border border-slate-200/80 bg-white rounded-xl`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a visualização expandida de e-mail na timeline com cabeçalhos recolhíveis (`De`, `Para`, `Assunto`, `Data`).
    2. [ ] Implementar renderizador higienizado de conteúdo HTML para o corpo da mensagem.
    3. [ ] Criar indicador visual de anexo e integração com tickets de suporte (Zendesk ID).

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Gerente Comercial de Pós-Vendas,  
    > **Quero** visualizar a troca de e-mails históricos de um lead,  
    > **Para** entender quais alinhamentos técnicos de dimensionamento de inversor foram enviados antes do fechamento do contrato.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Exibição de e-mail higienizado contra XSS
      Dado que existe um e-mail gravado contendo tags de script maliciosas "<script>alert('hack')</script>" no corpo
      Quando o usuário abre a visualização de detalhes deste e-mail na timeline
      Então o sistema deve omitir a execução do script e renderizar apenas o texto limpo com segurança
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface EmailTimelineItemProps {
      email: {
        id: string;
        subject: string;
        body: string;
        sent_time: string;
        contact_names?: string[];
      };
    }
    export const EmailTimelineItem: React.FC<EmailTimelineItemProps> = ({ email }) => { ... };
    ```
*   **Comportamento & Erros**: Componentes pesados (como o corpo do e-mail com muitos caracteres) devem utilizar renderização tardia (*lazy loading*) e truncamento com botão "Ver Mais" para otimizar o tempo de pintura de tela (*First Contentful Paint*) na timeline.

---

### 5. `Leads.csv` (Funil de Vendas - Oportunidades Comerciais)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Monitorar o progresso comercial de cada oportunidade de projeto solar desde o primeiro contato até o fechamento físico da usina.
*   **Campos Reais do Domínio**: `id`, `lead_number`, `name`, `description`, `status`, `confidence`, `outcome`, `milestone`, `percent_complete`, `creator`, `owner`, `date_created`, `expected_closed_date`, `date_closed`, `last_contacted`, `last_modified`, `market`, `value`, `accounts`, `contacts`, `products`, `competitors`, `sources`, `tags`.
*   **Regra de Negócio Crítica**: O valor da oportunidade comercial (`value`) deve ser formatado financeiramente e associado a uma porcentagem de certeza de fechamento (`confidence`). Transições de estágio (*milestone*) devem registrar automaticamente a data da modificação para fins de cálculo de ciclo médio de vendas por vendedor.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Badge de Status Ganho (`Won`): `bg-emerald-50 text-emerald-700 border-emerald-200`. Badge de Status Aberto (`Open`): `bg-amber-50 text-amber-700 border-amber-200`. Tipografia de Destaque Financeiro: `font-black text-slate-900`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Implementar a visualização Kanban com colunas correspondentes às metas principais (`Qualify`, `Pitch`, `Close`).
    2. [ ] Criar componente de barra de progresso horizontal baseado no percentual completo (`percent_complete`).
    3. [ ] Criar painel de cabeçalho com ações rápidas para marcar o lead como Ganho/Perdido.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Diretor de Vendas Solar,  
    > **Quero** visualizar a listagem completa e o valor acumulado de todos os leads ativos,  
    > **Para** que eu consiga estimar a receita de comissão e a necessidade de estoque de módulos fotovoltaicos para o próximo mês.  
    *   **Pontuação Estimada (Story Points)**: **8 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Classificação automática do lead como Won
      Dado que o usuário está na página de detalhes do Lead no estágio "Pitch"
      Quando ele clica no botão "Marcar como Ganho (Won)"
      Então o status deve mudar para "Won", o campo "confidence" para "100%" e a data atual deve ser gravada em "date_closed"
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface LeadCardProps {
      lead: {
        id: string;
        lead_number: number;
        name: string;
        value: string;
        confidence: string;
        milestone: string;
      };
      onDragStart: (e: React.DragEvent, id: string) => void;
    }
    ```
*   **Comportamento & Erros**: Ao arrastar um cartão entre colunas do Kanban, realizar a transição na UI com animação suave e persistir as alterações na API com atualização otimista. Se a requisição falhar (ex: sem permissões RBAC ou perda de conexão), reverter o cartão à coluna original de origem e disparar alerta toast.

---

### 6. `Notes.csv` (Anotações Internas de Vendas e Colaboração)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Fornecer um espaço livre para anotações internas, alinhamentos, resumos de vistorias técnicas e conversas telefônicas, promovendo o trabalho em equipe.
*   **Campos Reais do Domínio**: `id`, `type`, `subject_id`, `name`, `creator`, `note`, `created_time`, `subject_legacy_id`, `associated_entity_id`, `associated_legacy_id`.
*   **Regra de Negócio Crítica**: O campo `note` deve aceitar anotações em texto corrido e possibilitar a menção direta de colegas utilizando o caractere `@` (ex: `@[Users:1]`), disparando notificações em tempo real para os colaboradores marcados na plataforma.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Cor de Destaque da Nota: `bg-amber-50/60 border-l-2 border-amber-400`. Tipografia de Texto Interno: `text-slate-700 leading-relaxed text-sm`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Criar o componente de digitação rápida de notas (`NoteComposer`) com editor WYSIWYG básico.
    2. [ ] Desenvolver popover inteligente de autocomplete para exibição de sugestões de usuários ao digitar "@".
    3. [ ] Criar o histórico de cartões de notas na timeline ordenados cronologicamente do mais recente para o mais antigo.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** SDR de Energia Solar,  
    > **Quero** registrar uma nota sobre a inclinação do telhado do cliente e mencionar o Engenheiro Projetista,  
    > **Para** que ele receba um alerta imediato e possa validar a viabilidade técnica de instalação.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Criação de anotação interna com gatilho de menção
      Dado que o usuário está editando o composer de notas do lead
      Quando ele insere o texto "Revisar telhado @[Felipe]" e clica em salvar
      Então a nota deve ser salva associada ao lead e um evento de notificação em tempo real deve ser disparado para o usuário Felipe
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface NoteComposerProps {
      associatedEntityId: string;
      associatedEntityType: 'Leads' | 'Contacts' | 'Accounts';
      onSave: (noteText: string) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Bloquear o envio de notas vazias desabilitando o botão "Salvar". Ao disparar o salvamento, exibir indicador spinner de carregamento inline no botão e desabilitar a edição do campo de texto para evitar cliques e submissões em duplicidade.

---

## SEÇÃO B: COMPONENTES GLOBAIS E ENTRADAS DE DADOS (IMAGENS)

### 7. `add-new-btn.png` (Mecanismo Dropdown de Ação Rápida Global)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Proporcionar um atalho de criação rápida universal a partir de qualquer página do sistema, permitindo que o vendedor cadastre instantaneamente novos Contatos, Contas, Atividades, E-mails e Oportunidades sem quebrar seu fluxo de navegação atual.
*   **Regra de Negócio Crítica**: O clique em cada item do menu dropdown deve abrir o respectivo formulário de criação em um modal de sobreposição (*overlay*) na tela ativa, mantendo o contexto da visualização que o usuário estava acessando.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Estilo do Botão Principal: `bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all duration-150 active:scale-95 shadow-sm`. Estilo do Menu Dropdown: `bg-white border border-slate-200/80 rounded-xl shadow-xl z-50 py-1 px-1.5 w-48 animate-in fade-in duration-100`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Implementar o botão "Add New" com ícone de adição (+) e indicador chevron (v) na Topbar.
    2. [ ] Desenvolver o menu dropdown flutuante gerenciado por estado que fecha automaticamente ao clicar fora (*click-outside listener*).
    3. [ ] Criar microinteração de escala leve ao clicar (active:scale-95) para feedback físico na UI.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Vendedor em Campo,  
    > **Quero** acessar o atalho "Add New" da barra superior a partir da tela de relatórios,  
    > **Para** cadastrar rapidamente um contato novo que acabo de conhecer, sem precisar navegar até a página de contatos.  
    *   **Pontuação Estimada (Story Points)**: **2 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Abertura de modal a partir de atalho global
      Dado que o usuário está navegando na página de relatórios de faturamento
      Quando ele clica no botão "Add New" e clica na opção "Add a Person"
      Então o menu dropdown deve fechar e o modal de criação de contato deve abrir imediatamente por cima da tela
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface GlobalAddProps {
      onOpenForm: (formType: 'person' | 'company' | 'lead' | 'activity') => void;
    }
    ```
*   **Comportamento & Erros**: Utilizar portais React (`React Portal`) para renderizar o menu dropdown fora da hierarquia DOM principal do cabeçalho, prevenindo problemas de corte visual de layout causados por propriedades `overflow-hidden` ou conflitos de posicionamento de `z-index`.

---

### 8. `api-key-setup.png` (Painel de Configuração de Credenciais de API)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Permitir que administradores gerenciem de forma segura tokens de acesso de API para conexões de entrada com landing pages externas, formulários de contato institucionais ou integrações complexas.
*   **Regra de Negócio Crítica**: As chaves de API devem ser geradas através de hashes criptográficos irreversíveis e exibidas por completo apenas uma vez após a criação. No banco de dados, as chaves devem ser armazenadas com criptografia robusta (AES-256) ou hash seguro (SHA-256) para conformidade rígida de segurança.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Input de Chave (Somente Leitura): `font-mono bg-slate-50 border-slate-200 text-xs px-3 py-2 rounded-lg select-all text-slate-600 outline-none focus:ring-1 focus:ring-slate-300`. Botão de Cópia: `p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-all text-slate-500`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Desenvolver a tela administrativa de gerenciamento de chaves com tabela exibindo nome da chave, data de criação, último uso e status de ativação.
    2. [ ] Criar o componente de visualização de chave com botão integrado de "Copiar para Área de Transferência" (`CopyToClipboard`).
    3. [ ] Implementar caixa de diálogo de confirmação segura de remoção de credencial (Revogar Chave).

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Integrador de Sistemas de Automação,  
    > **Quero** gerar uma nova chave de API e copiá-la com um clique,  
    > **Para** que eu possa autenticar o formulário de captação de leads do site solar externo e enviar oportunidades ao CRM.  
    *   **Pontuação Estimada (Story Points)**: **3 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Geração de chave de API única e cópia segura
      Dado que o administrador administrativo está na tela de credenciais de API
      Quando ele clica no botão "Generate API Key"
      Então o sistema deve criar e exibir o novo token em formato monospace, e ao clicar em "Copy", o texto deve ser copiado para a área de transferência com feedback toast de sucesso
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface ApiKeyRowProps {
      apiKey: {
        id: string;
        name: string;
        tokenPreview: string;
        createdAt: string;
        lastUsedAt?: string;
        isActive: boolean;
      };
      onRevoke: (id: string) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Ao copiar a chave, o sistema deve exibir visualmente o texto temporário "Copiado!" no botão de cópia por exatamente 2 segundos, resetando em seguida. Se o navegador não der suporte à API de Clipboard nativa, capturar o erro e realizar o fallback focando e selecionando todo o texto do input automaticamente para que o usuário copie manualmente.

---

### 9. `chat-setting-.png` (Integração de Canais e Configurações de Chat de Atendimento)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Centralizar as parametrizações de ferramentas de comunicação por chat em tempo real, integrando mensageiros flutuantes de suporte com a captura de novos leads de vendas fotovoltaicas.
*   **Regra de Negócio Crítica**: A ativação de um widget de chat na landing page institucional deve possibilitar que conversas iniciadas por novos usuários sejam convertidas e salvas automaticamente em contatos e leads dentro da plataforma, registrando as primeiras mensagens como anotações iniciais.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Interruptor Activo (Toggle Switch): `bg-slate-900 border-2 border-slate-900 w-11 h-6 rounded-full transition-colors relative duration-200 ease-in-out cursor-pointer`. Posição do Pino do Toggle: `translate-x-5 shadow-sm bg-white rounded-full w-5 h-5 absolute top-0.5 left-0.5 transition-transform duration-200`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a interface de toggles de canais de chat (ex: Integrar Chat Flutuante, Integração Whatsapp).
    2. [ ] Criar painel de seleção de regras de distribuição de conversações automáticas para os corretores e SDRs do time comercial.
    3. [ ] Desenvolver visualização de testes práticos de recebimento de webhook de novas mensagens.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Gerente Comercial de Vendas,  
    > **Quero** ativar e configurar a integração de chat,  
    > **Para** que cada novo visitante do site que iniciar uma simulação de telhado por texto vire uma oportunidade comercial automática na minha carteira de leads.  
    *   **Pontuação Estimada (Story Points)**: **3 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Ativação de canal de chat em tempo real
      Dado que o administrador está na tela de conexões e integrações de chat
      Quando ele clica no interruptor (toggle) para ativar o Chat Integrado
      Então o status deve mudar visualmente para ativo, persistir a configuração na API de forma dinâmica e habilitar os campos de distribuição de leads subordinados
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface ChatSettingProps {
      channelId: string;
      isEnabled: boolean;
      distributionStrategy: 'round_robin' | 'manual';
      onToggle: (id: string, nextState: boolean) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Ao alternar o estado do interruptor (toggle), o componente deve assumir o estado visual de transição bloqueando novos cliques. Se a conexão com o servidor falhar durante a persistência, o toggle deve reverter visualmente ao estado original informando a indisponibilidade através de um toast vermelho de erro.

---

### 10. `comapnie-page-1.png` / `companie-page.png` / `companoe-page-2.png` (Tela de Detalhe e Visão 360° da Empresa)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Fornecer ao vendedor a visão consolidada de todas as interações, oportunidades financeiras em andamento, contatos vinculados e histórico cronológico associados a uma empresa cliente corporativa específica.
*   **Regra de Negócio Crítica**: O painel central de timeline deve agrupar de forma unificada e cronológica as notas internas, os e-mails enviados/recebidos e as atividades agendadas ou finalizadas. O painel lateral esquerdo de dados da empresa deve contar com mapa integrado para rotas logísticas e de instalação, além do painel de campos customizados configurados pelo administrador.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Grid de Divisão Central: `grid grid-cols-1 xl:grid-cols-3 gap-8`. Abas da Timeline (Selecionada): `border-b-2 border-slate-900 font-bold text-slate-900 text-sm py-2 px-1 transition-all`. Aba Não Selecionada: `text-slate-500 hover:text-slate-800 text-sm py-2 px-1 transition-all`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar o layout em duas ou três colunas com painel lateral fixo de propriedades da empresa e área central fluida de timeline.
    2. [ ] Criar o painel superior de informações gerais com mapa integrado de localização para facilitar a logística de vistoria de sombreamento.
    3. [ ] Implementar abas dinâmicas para troca de foco na timeline ("All Activities", "Notes", "Emails", "Tasks").

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Gerente Comercial de Grandes Contas (Key Accounts),  
    > **Quero** visualizar o perfil de uma empresa cliente e sua timeline integrada,  
    > **Para** que eu possa revisar as últimas anotações técnicas e o progresso da proposta de usina solar antes de iniciar uma reunião comercial presencial.  
    *   **Pontuação Estimada (Story Points)**: **8 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Alternar abas da timeline de interações da empresa
      Dado que o usuário está no perfil 360 de uma empresa específica
      Quando ele clica na aba "Emails" no seletor de timeline
      Então o sistema deve recarregar a timeline central ocultando notas e tarefas e exibindo unicamente o histórico de e-mails recebidos e enviados para a corporação
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface CompanyProfileProps {
      companyId: string;
      companyData: {
        name: string;
        address: string;
        phone?: string;
        website?: string;
        industry?: string;
      };
    }
    ```
*   **Comportamento & Erros**: Se as interações da timeline demorarem para carregar, o sistema deve exibir cartões cinzas com efeito pulsar animado (*Skeleton States*) simulando o formato dos itens reais da timeline, impedindo o layout de quebrar ou saltar visualmente de posição após o carregamento completo.

---

### 11. `companie-page-email-modal.png` (Modal Flutuante de Composição e Envio de E-mails)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Habilitar a redação e o disparo de e-mails comerciais diretamente pelo vendedor sem precisar abrir uma caixa de correio externa (Outlook/Gmail). Isso viabiliza o acompanhamento ágil de simulações financeiras ou propostas de investimento solar de forma integrada com a timeline.
*   **Regra de Negócio Crítica**: O formulário de composição de e-mail deve permitir a escolha rápida do destinatário (com base nos contatos associados à empresa), seleção de remetente (contas de e-mail conectadas SMTP do vendedor) e suporte para carregar modelos de e-mail salvos.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Caixa Flutuante de E-mail (Widget de Canto): `fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border border-slate-200 w-[550px] z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200`. Linha de Input Horizontal: `border-b border-slate-100 px-4 py-2 flex items-center gap-2`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar o modal flutuante com cabeçalho de cabeçalho cinza, botão de fechar (x), minimizar (_) e expandir.
    2. [ ] Criar área de rich text higienizada e responsiva com controle de altura dinâmica.
    3. [ ] Criar painel lateral ou dropdown de seleção de templates com pré-visualização inline de conteúdo.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Vendedor Solar,  
    > **Quero** escrever um e-mail de acompanhamento para o cliente direto do perfil da empresa, utilizando um template de proposta salvo,  
    > **Para** que eu economize tempo de digitação repetitiva de especificações técnicas do gerador e envie a simulação em menos de 1 minuto.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Seleção de template e preenchimento de variáveis
      Dado que o usuário está redigindo um e-mail no modal flutuante
      Quando ele seleciona o template "Apresentação Solar B2C" no dropdown de modelos
      Então o assunto e o corpo do e-mail devem ser atualizados dinamicamente substituindo variáveis como "{{contact_name}}" pelo nome do contato selecionado
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface EmailComposerProps {
      isOpen: boolean;
      onClose: () => void;
      defaultRecipients: { email: string; name: string }[];
      onSend: (data: { to: string; subject: string; body: string }) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Durante o envio do e-mail (clique no botão "Send"), o modal deve exibir estado de envio, desabilitando todos os controles de edição. Caso ocorra erro de conexão com o servidor SMTP, exibir mensagem detalhada de erro no topo do modal de composição, reativando os campos para que o vendedor possa corrigir o e-mail ou tentar reenviar sem perder o texto escrito.

---

### 12. `companie-page-write-note.png` (Componente de Registro Rápido de Notas e Menções)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Fornecer uma interface intuitiva fixada no topo da timeline de atividades que incentiva o vendedor a registrar anotações pós-reunião ou descobertas sobre as necessidades energéticas do lead de forma imediata.
*   **Regra de Negócio Crítica**: O campo de texto deve redefinir seu tamanho vertical para comportar textos longos automaticamente de acordo com a digitação. Deve possuir suporte completo a formatações ricas (negrito, listas de tarefas, links) e disparar notificações internas para colegas de equipe marcados utilizando menções com `@`.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Área de Input Ativa: `bg-white border border-slate-300 focus-within:ring-2 focus-within:ring-slate-900 rounded-xl transition-all p-3 shadow-inner`. Botão de Salvar: `bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg active:scale-95 transition-all duration-100 disabled:opacity-50 disabled:pointer-events-none`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Implementar a caixa de texto de tamanho expansivo com espaçamento interno confortável.
    2. [ ] Desenvolver a barra de ferramentas inferior com atalhos de formatação básica (Negrito, Lista, Anexo de arquivos, Menção de Usuário).
    3. [ ] Criar animação de transição suave ao expandir o campo quando o vendedor foca na edição da nota.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Consultor Solar Técnico,  
    > **Quero** digitar um resumo da visita técnica de sombreamento do telhado e anexar fotos do quadro de disjuntores do cliente,  
    > **Para** que o engenheiro eletrotécnico possa acessar a documentação e desenhar o projeto elétrico fotovoltaico com segurança.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Redimensionamento automático do campo de anotação
      Dado que o usuário está digitando na caixa de registro de notas rápidas
      Quando o volume de texto inserido excede a altura inicial do input de 80px
      Então a caixa deve expandir verticalmente de forma suave acompanhando o texto, sem exibir barras de rolagem internas
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface InlineNoteComposerProps {
      placeholder?: string;
      onSaveNote: (note: { text: string; attachments?: File[] }) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Impedir salvamento duplicado de notas desativando o botão "Salvar" e exibindo um spinner de carregamento após o primeiro clique. Caso algum arquivo anexado (ex: fotos de telhado ou faturas elétricas) exceda o limite de upload definido (ex: 15MB), alertar imediatamente na interface com um indicador vermelho abaixo da nota, omitindo o envio do arquivo pesado e preservando o texto digitado pelo usuário.

---

### 13. `companie-tipes.png` (Parametrização e Tipos de Organizações/Empresas)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Permitir que administradores de RevOps categorizem a base de empresas para segmentação de carteiras comerciais e relatórios analíticos de faturamento por tipo de canal.
*   **Regra de Negócio Crítica**: O sistema deve possuir tipos de empresas padrão pré-definidos (ex: "Customer", "Prospect", "Partner", "Competitor"). A alteração ou exclusão de um tipo de organização deve alertar o administrador caso existam empresas cadastradas sob aquela classificação na base do CRM, exigindo a reatribuição em lote para prosseguir.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Borda e Fundo por Tipo de Conta: "Prospect" -> `bg-amber-50 text-amber-800 border-amber-200`; "Competitor" -> `bg-rose-50 text-rose-800 border-rose-200`; "Integrador" -> `bg-indigo-50 text-indigo-800 border-indigo-200`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Implementar a tabela de tipos de empresa no painel administrativo de configurações do CRM.
    2. [ ] Projetar o modal de cadastro de novo tipo de empresa com seleção de cor/badge customizada para visualização unificada.
    3. [ ] Criar alerta de diálogo informando as restrições ao tentar deletar um tipo com contas ativas vinculadas.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Administrador de RevOps Comercial,  
    > **Quero** cadastrar um tipo de empresa específico para "Integradores Credenciados",  
    > **Para** que o time de corretores possa filtrar rapidamente as contas e direcionar cotações de fornecimento de kits de placas solares com preços de parceiro.  
    *   **Pontuação Estimada (Story Points)**: **3 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Tentativa de exclusão de tipo de empresa em uso
      Dado que o administrador administrativo tenta excluir o tipo de conta "Customer"
      Quando existem 150 empresas vinculadas sob o tipo "Customer" no banco de dados
      Então o sistema deve bloquear a deleção, exibir modal de erro e instruir o usuário a mover as contas existentes para outro tipo antes de excluir
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface AccountTypeSettingsProps {
      types: { id: string; label: string; count: number; colorCode: string }[];
      onCreateType: (label: string, colorCode: string) => Promise<void>;
      onDeleteType: (id: string) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Ao criar um novo tipo de empresa, utilizar tratamento otimista para incluir instantaneamente a nova linha na tabela da tela de configurações. Se houver falha de rede ou validação duplicada no backend, reverter o estado visual imediatamente e disparar toast informativo com fundo vermelho.

---

### 14. `competitros.png` (Módulo de Cadastro e Monitoramento de Concorrentes)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Cadastrar concorrentes de mercado no setor de energia solar, permitindo mapear quais usinas de outras marcas o cliente está cotando em paralelo, fornecendo dados cruciais para análise competitiva de preços e motivos de perda de negócios (*Lost Reasons*).
*   **Regra de Negócio Crítica**: Uma oportunidade comercial (`Lead`) pode ter múltiplos concorrentes associados. Quando um lead é marcado como perdido (`Lost`), o sistema deve exigir o registro do motivo e permitir a seleção de qual concorrente cadastrado levou o contrato para alimentar estatísticas de inteligência comercial.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Card de Concorrente: `bg-white hover:border-rose-300 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all duration-150`. Badge de Força de Mercado: `bg-rose-50 border border-rose-100 text-rose-800 font-bold text-xs px-2 py-0.5 rounded-full`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar o painel administrativo de cadastro de concorrentes com dados de site, pontos fortes e fracos de ofertas.
    2. [ ] Desenvolver componente de busca dinâmica de seleção de concorrente em lote para vinculação nos leads de vendas.
    3. [ ] Criar gráfico de pizza representativo de participação de concorrência nos negócios perdidos no painel de relatórios.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** SDR de Vendas Solar,  
    > **Quero** associar o concorrente "SolTech SA" ao lead de simulação técnica que estou qualificando,  
    > **Para** que o vendedor responsável saiba de antemão que o cliente possui um orçamento de placas concorrentes de menor preço.  
    *   **Pontuação Estimada (Story Points)**: **3 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Associação de concorrente a lead de vendas
      Dado que o usuário está editando a barra lateral do lead comercial
      Quando ele insere o nome de um concorrente cadastrado no campo "Competitors" e clica em salvar
      Então o concorrente deve ficar fixado no lead e ser exibido sob formato de chip list na barra lateral de detalhes
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface CompetitorSelectorProps {
      selectedCompetitorIds: string[];
      onAssociateCompetitor: (competitorId: string) => Promise<void>;
      onRemoveCompetitor: (competitorId: string) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Exibir dropdown de sugestões de concorrentes de forma assíncrona filtrando à medida que o usuário digita. Se o usuário digitar um concorrente inexistente na base administrativa, o sistema deve exibir botão simplificado "+ Cadastrar Concorrente inline" para criar a entidade sem precisar sair da página do lead.

---

### 15. `custotim filed organization.png` (Configurador de Campos Personalizados / Custom Fields)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Permitir que administradores criem propriedades de dados sob medida para as entidades do sistema. No setor solar, isso viabiliza criar de forma inline campos essenciais como "Geração Mensal Esperada (kWh)", "Tipo de Rede Elétrica (Monofásico, Bifásico, Trifásico)" e "Material da Estrutura do Telhado".
*   **Regra de Negócio Crítica**: Campos customizados criados devem ficar disponíveis de forma dinâmica em todas as telas de criação e detalhes da entidade correspondente, persistindo dados de acordo com o tipo (Texto, Número, Seleção, Checkbox).

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Linha de Configuração de Campo: `bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm`. Badge do Tipo de Dado: `font-mono text-xs bg-slate-200/80 px-2.5 py-1 rounded text-slate-700 font-semibold`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a interface de criação de campos personalizados escolhendo a entidade-mãe (Accounts, Contacts, Leads).
    2. [ ] Desenvolver o seletor de tipos de dados (Texto Curto, Texto Longo, Seleção Dropdown, Número Inteiro).
    3. [ ] Criar visualização de arrastar para ordenar (`Drag & Drop Reordering`) a exibição dos campos customizados nas telas de perfil.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Diretor de RevOps Solar,  
    > **Quero** criar um campo personalizado do tipo dropdown chamado "Tipo de Telhado" para a entidade Leads,  
    > **Para** que os vendedores selecionem se a instalação será em Telha Cerâmica, Fibrocimento ou Solo, personalizando a precificação.  
    *   **Pontuação Estimada (Story Points)**: **8 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Criação de campo customizado do tipo Dropdown com opções
      Dado que o administrador está na tela administrativa de campos customizados do Lead
      Quando ele cria um campo "Tipo de Telhado", seleciona tipo "Dropdown" e insere as opções "Fibrocimento, Solo, Cerâmica"
      Então o campo deve ficar disponível e renderizar um componente seletor (Select) com as opções exatas em todos os leads
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface CustomFieldConfig {
      id: string;
      entityType: 'Leads' | 'Contacts' | 'Accounts';
      name: string;
      dataType: 'text' | 'number' | 'dropdown' | 'boolean';
      options?: string[];
      isRequired: boolean;
    }
    ```
*   **Comportamento & Erros**: Validar e barrar nomes de variáveis com caracteres especiais ou duplicados na mesma entidade. Ao salvar a configuração, disparar compilação dinâmica e invalidar o cache global da aplicação para forçar as telas de perfil de leads ativas a renderizarem a nova propriedade de dados de forma assíncrona.

---

### 16. `documentes.png` (Gestão de Documentos e Arquivos Anexados)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Centralizar a gestão de arquivos essenciais ao projeto fotovoltaico (ex: cópia legível de Fatura de Energia, Desenhos de Engenharia, ART de Projetista, Contrato Comercial Assinado).
*   **Regra de Negócio Crítica**: Arquivos enviados devem possuir controle rígido de tamanho máximo (limite de 15MB) e extensões permitidas (PDF, PNG, JPG, DWG, XLSX). O upload de arquivos de contratos ou vistorias de engenharia deve registrar o usuário responsável pelo upload e a data/hora exata do processamento físico do anexo.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Área de Drag & Drop de Arquivos: `border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-2xl bg-slate-50/50 hover:bg-slate-50 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150`. Ícone do Tipo de Arquivo (PDF): `text-rose-500 bg-rose-50 rounded-lg p-2`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Implementar a área de arrastar e soltar arquivos com indicador visual de estado ativo ao arrastar arquivos por cima (*drag-over state*).
    2. [ ] Desenvolver a listagem de arquivos anexados com ícones correspondentes aos formatos (PDF, Planilhas, Imagens) e tamanho computado legível (KB/MB).
    3. [ ] Criar barra de progresso individual animada para upload simultâneo de múltiplos documentos.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Vendedor Comercial de Vendas,  
    > **Quero** arrastar e anexar a fatura de energia em PDF do cliente à ficha de qualificação do lead,  
    > **Para** que a equipe técnica de engenharia possa validar o histórico de consumo elétrico mensal e realizar o dimensionamento preciso da usina.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Drag and drop de arquivo com validação de extensão
      Dado que o usuário arrasta um arquivo executável "malware.exe" por cima da área de upload de documentos do lead
      Quando ele solta o arquivo para iniciar o processamento
      Então o sistema deve bloquear o upload, exibir uma tarja vermelha de erro informando extensão de arquivo não permitida
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface DocumentAttachmentProps {
      leadId: string;
      attachments: { id: string; filename: string; sizeBytes: number; fileUrl: string; uploadedBy: string; createdAt: string }[];
      onUpload: (files: FileList) => Promise<void>;
      onRemove: (id: string) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Mostrar progresso de upload com porcentagem precisa na UI. Se a rede sofrer interrupção temporária durante o upload de faturas ou PDFs, reter a interface informando a falha, liberando botão simplificado de re-tentativa individual de envio a partir do ponto em que o arquivo parou.

---

### 17. `emailtemplates.png` (Biblioteca de Modelos e Templates de E-mail de Vendas)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Padronizar as comunicações recorrentes enviadas pelo time de corretores para aumentar a eficiência de propostas comerciais de usinas fotovoltaicas e e-mails de nutrição.
*   **Regra de Negócio Crítica**: Modelos de e-mail devem possuir marcadores de substituição (*placeholders*) para variáveis do banco (ex: `{{contact_name}}`, `{{company_name}}`, `{{solar_savings_annual}}`) que se traduzem automaticamente de acordo com o contexto do lead em que são disparados.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Linha de Template na Lista: `bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between hover:shadow-md transition-all duration-150`. Ícone de Template de Modelo: `text-indigo-500 bg-indigo-50 rounded-lg p-2 border border-indigo-100`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a tela de cadastro e biblioteca de modelos de e-mail com editor de formatação rich text embutido.
    2. [ ] Criar catálogo lateral de variáveis de domínio clicáveis para inclusão ágil de placeholders de substituição.
    3. [ ] Criar painel flutuante de visualização rápida em tempo real do template simulando dados reais.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** SDR de Vendas Solar,  
    > **Quero** criar um modelo de e-mail chamado "Simulação Financeira Concluída" contendo variáveis automáticas de economia anual,  
    > **Para** que o corretor dispare propostas customizadas sem redigir manualmente os dados de engenharia calculados.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Inclusão de variável de engenharia solar em template
      Dado que o usuário está criando um modelo de e-mail no editor administrativo
      Quando ele clica no botão "Inserir variável" e escolhe a opção "Economia Anual de Energia (R$)"
      Então o texto {{solar_savings_annual}} deve ser incluído exatamente na posição ativa do cursor de texto do e-mail
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface EmailTemplateEditorProps {
      template?: { id: string; title: string; subject: string; bodyHtml: string };
      onSave: (data: { title: string; subject: string; bodyHtml: string }) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Validar e alertar o usuário se o template possuir marcadores de variáveis com formatações inválidas ou tags incompletas (ex: `{{contact_name` sem fechamento de chaves). Ao disparar a compilação de pré-visualização, substituir as variáveis não reconhecidas por traços textuais legíveis ("---") para manter o layout limpo.

---

### 18. `engagement-bar.png` (Componente de Termômetro e Barra de Engajamento do Cliente)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Fornecer um indicador visual instantâneo do nível de interação histórica de um lead baseado na frequência de telefonemas concluintes, e-mails respondidos e reuniões técnicas qualificadas.
*   **Regra de Negócio Crítica**: A barra de engajamento deve ser calculada a partir de algoritmos de pontuação dinâmica (Lead Scoring). Projetos inativos por mais de 15 dias sem registros de timeline devem ver sua barra regredir, alertando sobre risco iminente de estagnação de vendas.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Barra de Fundo: `bg-slate-200 rounded-full h-2 w-24 overflow-hidden`. Indicador Ativo (Engajamento Alto): `bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out`. Indicador Frio (Baixo Engajamento): `bg-gradient-to-r from-rose-400 to-rose-600 h-full rounded-full transition-all duration-500`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Desenvolver o indicador visual compacto de termômetro de engajamento para exibição nas tabelas de listagem rápida e cabeçalhos de leads.
    2. [ ] Criar tooltip de apoio explicativo detalhando quais ações recentes mantêm o indicador em nível satisfatório.
    3. [ ] Criar microanimação de preenchimento suave da barra de progresso de engajamento ao abrir a página do lead comercial.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Diretor Comercial de RevOps,  
    > **Quero** visualizar um termômetro de engajamento em formato de barra em cada lead da listagem geral de oportunidades comerciais,  
    > **Para** que o time comercial filtre instantaneamente os negócios mais quentes e priorize o contato com as indústrias engajadas.  
    *   **Pontuação Estimada (Story Points)**: **2 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Atualização da barra de engajamento pós ligação registrada
      Dado que o lead comercial se encontra com engajamento "Frio" de 20%
      Quando o SDR registra uma atividade concluída do tipo "Reunião de Venda"
      Então o sistema deve processar o algoritmo e a barra de engajamento deve realizar transição fluida para 80% (Engajamento Quente)
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface EngagementBarProps {
      scoreValue: number; // Valor de 0 a 100 representativo de engajamento
      tooltipText: string;
    }
    ```
*   **Comportamento & Erros**: Utilizar animações CSS nativas de transição suave baseadas em propriedades de largura (`transition-all duration-500`) para otimizar a renderização. Se o valor do score de engajamento recebido for inválido ou nulo, o componente deve fazer o fallback para 0% exibindo contorno cinza neutro protetor.

---

### 19. `free-seo-scam.png` (Módulo e Integração de Auditoria de SEO Solar e Landing Pages)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Ferramenta de automação de captura baseada em simulação/auditoria online. No ecossistema solar, este módulo disponibiliza um widget público de "Simulação de Telhado e Viabilidade Técnica" para ser embutido no site institucional, qualificando usuários de forma autônoma.
*   **Regra de Negócio Crítica**: Usuários externos que inserirem dados de faturamento e área de telhado no widget online devem ser imediatamente convertidos em leads dentro do CRM. O sistema deve atribuir tags de origem ("Landing Page") e direcionar o lead automaticamente por meio de estratégia de revezamento equilibrado (Round Robin) para os corretores cadastrados.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Fundo do Bloco Informativo de Conversão: `bg-sky-50 border border-sky-100 p-5 rounded-2xl flex items-center justify-between shadow-sm`. Texto do Canal de Origem: `font-bold text-sky-800 text-xs px-2.5 py-1 rounded bg-sky-100 border border-sky-200`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Desenvolver a tela administrativa de controle de leads gerados através de simulação externa de faturas no site.
    2. [ ] Criar cartões explicativos de conversão de leads por canal, contendo estatísticas de leads criados e taxa de conversão em tempo real.
    3. [ ] Criar área de visualização em tempo real de contatos que simularam no site nos últimos 30 minutos.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Diretor de Marketing de Aquisição,  
    > **Quero** monitorar a volumetria de leads vindos do widget institucional de simulação fotovoltaica do site,  
    > **Para** que eu valide se as campanhas de captação digital estão trazendo indústrias e clientes interessados no dimensionamento de energia.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Conversão automática de simulação externa para Lead do CRM
      Dado que um visitante do site institucional preenche todos os dados do formulário de viabilidade de telhado
      Quando ele clica em "Receber Orçamento Gratuito" no site
      Então os dados do simulador de telhado devem criar um Lead no CRM com tags de origem correspondentes e status de aberto
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface SeoScannerLeadRowProps {
      scannerLead: {
        id: string;
        websiteOrAddress: string;
        monthlyBillValue: string;
        contactName: string;
        contactEmail: string;
        assignedBrokerName?: string;
        createdAt: string;
      };
      onAssignManual: (leadId: string, brokerId: string) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Ao receber dados de landing page externa, o sistema deve validar a unicidade de e-mail e telefone. Caso já exista um contato com o mesmo e-mail na base, evitar duplicações mesclando os novos dados de simulação de telhado como uma nova oportunidade aberta associada ao contato original existente, notificando o proprietário atual da conta.

---

### 20. `landing-pages.png` (Painel de Gestão de Páginas de Destino e Captação Digital)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Monitorar a eficácia de cada campanha de marketing solar baseada em landing pages dedicadas (ex: "Especial Usina Solar para Empresas", "Simulador Solar de Fatura de Energia Residencial").
*   **Regra de Negócio Crítica**: Cada landing page cadastrada no CRM possui um identificador único que mapeia a origem e as campanhas UTM. O sistema deve acompanhar em tempo real o volume de impressões únicas, cadastros finalizados e taxa de conversão final para alimentar relatórios de ROI de anúncios.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Grid de Cards de Campanha: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`. Taxa de Conversão em Destaque: `text-2xl font-black text-slate-900 font-sans tracking-tight`. Card de Estatísticas Rápidas: `bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a tela de monitoramento de landing pages ativas com dados de conversão de leads.
    2. [ ] Criar o componente de visualização de performance de tráfego com gráficos de linha mostrando o histórico diário de acessos.
    3. [ ] Criar tabela de leads gerados listados de forma cronológica com status de atendimento ativo.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Analista de Growth Marketing,  
    > **Quero** visualizar a taxa de conversão da Landing Page "Usina Agro" e o custo por lead,  
    > **Para** que eu possa ajustar o orçamento de anúncios patrocinados voltados a grandes produtores rurais que buscam redução de fatura.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Ativação de script de rastreamento para landing page cadastrada
      Dado que o analista de marketing cadastra uma nova Landing Page no painel administrativo
      Quando ele salva as propriedades, o sistema deve gerar um script de rastreamento com identificador único
      Então a interface deve exibir um código HTML/JS em bloco monospace legível com atalho de cópia rápida
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface LandingPageCardProps {
      page: {
        id: string;
        title: string;
        url: string;
        viewsCount: number;
        leadsGeneratedCount: number;
        conversionRatePercent: number;
        isActive: boolean;
      };
      onToggleActive: (id: string) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Ao desativar temporariamente uma landing page no painel, as requisições de formulários vindas desta origem devem ser recusadas com código de status apropriado na API, e na UI o cartão de monitoramento da campanha deve transicionar visualmente para escala em tons de cinza opacos (`grayscale opacity-60`).

---

### 21. `lead-bar.png` (Componente de Linha de Progresso e Estágios do Lead Comercial)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Componente visual estático ou interativo fixado no topo da página de detalhes do Lead que reflete o estágio atual do lead no funil de vendas, servindo de guia rápido para o processo comercial padrão.
*   **Regra de Negócio Crítica**: Os estágios comerciais devem ser sequenciais (ex: Qualify -> Pitch -> Close). A alteração de estágio pela barra de progresso deve validar se os campos mínimos obrigatórios da etapa atual estão devidamente preenchidos (ex: para mover para "Pitch", é obrigatório preencher o consumo em kWh e tipo de telhado para dimensionamento da usina).

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Conector de Linha de Estágios: `flex items-center w-full select-none bg-slate-50 border border-slate-200 rounded-xl p-1.5`. Etapa Concluída: `bg-slate-900 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm`. Etapa Futura: `text-slate-500 hover:text-slate-800 text-xs py-1.5 px-3.5 rounded-lg cursor-pointer transition-all`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar o componente de barra de progressão de estágios horizontal com divisores em estilo de seta ou conexões minimalistas.
    2. [ ] Desenvolver indicador visual em formato de checkmark (✓) para etapas já completadas e ultrapassadas.
    3. [ ] Criar animação de preenchimento e transição de foco do estágio quando a etapa do lead é alterada.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Consultor Comercial de Vendas Solar,  
    > **Quero** visualizar a barra de progresso do lead e clicar no estágio "Pitch" para avançar a oportunidade comercial,  
    > **Para** que o sistema registre a mudança de estágio e o projeto fotovoltaico entre oficialmente no fluxo de desenho técnico.  
    *   **Pontuação Estimada (Story Points)**: **3 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Tentativa de avanço de estágio sem campos técnicos obrigatórios
      Dado que o lead está no estágio "Qualify" e o campo "Consumo Mensal (kWh)" está vazio
      Quando o usuário tenta avançar para o estágio "Pitch" clicando na barra de progresso
      Então o sistema deve bloquear a transição de etapa, exibir um popover vermelho alertando o preenchimento obrigatório e focar no campo técnico de kWh
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface ProgressStageBarProps {
      currentStage: 'Qualify' | 'Pitch' | 'Close';
      onSelectStage: (stage: 'Qualify' | 'Pitch' | 'Close') => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Utilizar tratamento otimista ao clicar em novo estágio na barra horizontal. Se o backend retornar erro de regra de negócio, reverter visualmente o estágio destacado para a etapa original, abrindo notificação toast explicativa sobre as restrições ou validações comerciais que impediram a movimentação.

---

### 22. `lead-form-1.png` / `lead-form.png` (Formulário Detalhado e Modal de Cadastro de Leads)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Modal ou tela integrada para cadastro de novas oportunidades comerciais no CRM, capturando de forma estruturada as necessidades do projeto do cliente.
*   **Regra de Negócio Crítica**: O formulário deve exigir a associação de pelo menos uma Empresa (`Account`) ou Contato (`Contact`). Deve contar com uma seção dedicada de **Especificações Técnicas de Engenharia Solar**, onde os campos "Consumo Médio Mensal (kWh)" e "Valor Médio de Fatura" são integrados para calcular e sugerir de forma inline a potência teórica recomendada do gerador.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Modal de Cadastro (Layout Centralizado): `fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4`. Caixa de Conteúdo do Modal: `bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-150`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar o layout do formulário em etapas (Wizard) ou em seções recolhíveis (Dados Comerciais, Dados de Contato e Dados do Projeto Solar).
    2. [ ] Criar componentes seletores assíncronos para vincular empresas ou criar contatos de forma inline sem fechar o modal principal.
    3. [ ] Implementar a lógica de cálculo solar inline que exibe a potência em kWp sugerida conforme o usuário digita o consumo em kWh.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** SDR de Energia Solar,  
    > **Quero** cadastrar um lead residencial preenchendo o consumo elétrico mensal de 800 kWh,  
    > **Para** que o formulário sugira instantaneamente a potência necessária do sistema fotovoltaico (kWp) e o número recomendado de módulos.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Sugestão de potência fotovoltaica inline de acordo com consumo
      Dado que o usuário está preenchendo o formulário de cadastro de Lead comercial
      Quando ele digita "1000" no input "Consumo Mensal (kWh)"
      Então a interface deve exibir dinamicamente abaixo do campo o texto sugestivo: "Potência Sugerida: ~8.1 kWp (Estimativa de 15 painéis de 550W)"
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface LeadCreateFormProps {
      isOpen: boolean;
      onClose: () => void;
      onSubmit: (leadData: any) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: O botão de envio do formulário ("Criar Lead") deve ficar desabilitado até que todos os campos obrigatórios (Nome do Lead, Contato Principal e Proprietário) sejam válidos. Se a API falhar no salvamento por problemas de conexão, reativar o formulário mantendo todos os dados preenchidos intactos e exibir tarja vermelha de erro ao topo.

---

### 23. `lead-page.png` / `lead-sidebar.png` (Tela Visão 360° e Ficha de Detalhes do Lead)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Visualização centralizada e gerencial contendo o dossiê completo de uma oportunidade de negócio, incluindo dados de engenharia solar e histórico de comunicações.
*   **Regra de Negócio Crítica**: A barra lateral de detalhes do lead (`lead-sidebar.png`) deve agrupar as informações complementares: Contatos associados, Empresa Vinculada, Concorrentes mapeados, Tags de segmentação e os **Dados de Dimensionamento Técnico Fotovoltaico** (Consumo kWh, Valor de Fatura, Tipo de Telhado e Potência Estimada).

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Divisão de Tela Central/Lateral: `grid grid-cols-1 lg:grid-cols-4 gap-8`. Cartão de Informações Técnicas na Sidebar: `bg-slate-50 border border-slate-200/80 p-4 rounded-xl shadow-inner flex flex-col gap-3 text-slate-700`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a página de detalhes com cabeçalho de destaque contendo nome do lead, valor do projeto, status de fechamento e barras de progresso.
    2. [ ] Implementar a sidebar do lead (`lead-sidebar`) com seções sanfonadas (*accordions*) para informações corporativas, financeiras e tags.
    3. [ ] Criar área central fluida de timeline com timeline integrada unificada de e-mails, notas rápidas e agendamentos.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Engenheiro Projetista Fotovoltaico,  
    > **Quero** acessar o perfil detalhado de um lead comercial ativo,  
    > **Para** revisar na barra lateral o tipo de telhado e o consumo elétrico faturado antes de elaborar a proposta executiva e o arranjo de painéis solares.  
    *   **Pontuação Estimada (Story Points)**: **8 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Visualização de dados de engenharia solar na sidebar do lead
      Dado que o usuário acessa o lead cadastrado "EcoTech Solutions"
      Quando a página de detalhes carrega por completo
      Então o painel lateral (sidebar) deve exibir uma seção "Especificações Solares" mostrando consumo de "1200 kWh", telhado "Cerâmica" e potência de "9.8 kWp"
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface LeadSidebarProps {
      lead: {
        id: string;
        monthlyConsumptionKwh?: number;
        roofType?: string;
        systemPowerKwp?: number;
        competitors?: { id: string; name: string }[];
        tags?: string[];
      };
      onUpdateSolarSpecs: (specs: { monthlyConsumptionKwh?: number; roofType?: string }) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Implementar carregamento assíncrono para os diferentes blocos de conteúdo da página. Se a sidebar ou timeline demorarem para carregar, aplicar estados de animação de esqueleto cinza (*skeletons*), permitindo que o usuário visualize de imediato as informações básicas do lead que carregam com maior rapidez ao topo da página.

---

### 24. `nutshell-ai.png` / `nutshell-ai-2.png` / `nutshell-ai-v3.png` (Módulo de Inteligência Artificial para Sumarização de Linha do Tempo)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Recurso de inteligência artificial generativa embutido nas timelines do CRM para sumarizar o histórico de notas, e-mails e reuniões, economizando tempo dos vendedores na revisão de contas.
*   **Regra de Negócio Crítica**: Ao clicar no botão "Summarize", o sistema deve recuperar de forma integrada as últimas 15 interações registradas na timeline, processar os textos e exibir um resumo em formato markdown condensando decisões de negociação, objeções de preços e alinhamentos de engenharia solar.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Bloco de Destaque do Resumo da IA: `bg-violet-50/50 border-l-4 border-violet-500 rounded-r-xl p-4 flex flex-col gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300`. Botão de Chamada da IA: `bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all active:scale-95`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a caixa de exibição do resumo de inteligência artificial ao topo da timeline de atividades do lead comercial.
    2. [ ] Desenvolver animação de carregamento estilizada simulando partículas de dados ou ondas com tons de roxo/violeta (*loading pulse*).
    3. [ ] Criar controles para copiar o resumo ou fixar o resumo gerado como uma nota de topo persistente na timeline.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Gerente de Vendas B2B,  
    > **Quero** clicar no botão "Summarize timeline" ao assumir um lead que estava na carteira de outro vendedor,  
    > **Para** que a IA me traga as principais decisões técnicas e financeiras em menos de 5 segundos, sem eu precisar ler dezenas de e-mails antigos.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Solicitação de resumo de timeline para a inteligência artificial
      Dado que o usuário está no perfil do Lead contendo 20 interações registradas na timeline
      Quando ele clica no botão "Summarize" da Inteligência Artificial
      Então o sistema deve exibir caixa flutuante roxa com loader pulsante, fazer a chamada de API e exibir o resumo formatado em texto legível
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface AiSummaryWidgetProps {
      entityId: string;
      entityType: 'Leads' | 'Contacts' | 'Accounts';
      onGenerateSummary: () => Promise<string>;
    }
    ```
*   **Comportamento & Erros**: Durante a requisição assíncrona para a API de Inteligência Artificial, o botão deve ficar em estado de carregamento exibindo o texto "Pensando...". Caso ocorra erro de timeout do servidor ou falha no serviço de IA, ocultar o loader de forma amigável, exibir botão de re-tentativa e disparar notificação toast alertando "Serviço de IA temporariamente indisponível".

---

### 25. `organization-industrie.png` (Segmentação Comercial por Setores e Ramos de Indústria)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Permitir a segmentação administrativa das Contas de acordo com a área econômica de atuação (ex: "Agrobusiness", "Metalúrgica", "Supermercados", "Serviços Técnicos").
*   **Regra de Negócio Crítica**: Uma Conta PJ deve possuir obrigatoriamente um setor industrial associado caso o tipo de conta seja classificado como cliente. Isso permite gerar relatórios de faturamento setoriais e campanhas de marketing direcionadas a nichos específicos com alto potencial de economia solar (como galpões comerciais de supermercados).

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Badge de Segmentação Industrial: `bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a tela de cadastro e edição de setores industriais no painel administrativo do CRM.
    2. [ ] Criar seletor dropdown com busca integrada para vinculação de ramo industrial nos formulários de empresas.
    3. [ ] Criar visualização de gráficos setoriais mostrando a receita acumulada do pipeline por setor de indústria.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Diretor de Marketing de Aquisição,  
    > **Quero** classificar os leads corporativos por setor industrial de "Agrobusiness",  
    > **Para** que eu possa disparar uma campanha contendo cases reais de economia solar de cooperativas agrícolas que reduziram a conta de luz em 95%.  
    *   **Pontuação Estimada (Story Points)**: **3 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Atualização de ramo de indústria de empresa PJ
      Dado que o usuário está editando os dados cadastrais de uma empresa cliente
      Quando ele seleciona o setor industrial "Retail" no dropdown de setores e salva
      Então a empresa deve ser persistida com a nova classificação industrial e passar a integrar relatórios corporativos do segmento
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface IndustrySettingsProps {
      industries: { id: string; name: string; accountsCount: number }[];
      onCreateIndustry: (name: string) => Promise<void>;
      onDeleteIndustry: (id: string) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Ao deletar uma classificação industrial, validar com mensagem modal se existem empresas vinculadas sob aquele ramo. Se houver, bloquear a deleção e sugerir ao usuário realizar a realocação das contas existentes para outro segmento padrão antes de prosseguir com a remoção.

---

### 26. `organization-markts.png` (Parametrização de Mercados de Atuação Comercial)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Cadastro e gerenciamento de frentes de mercado ou canais de distribuição de vendas (ex: "U.S. Market", "Latam Market", "Distribuidor B2B", "Consumidor Residencial B2C").
*   **Regra de Negócio Crítica**: Cada lead de energia solar criado deve pertencer a um canal de mercado configurado para possibilitar análises de conversão e ticket médio segmentadas por mercado de origem no hub de relatórios.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Chip de Mercado Ativo: `bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-2 py-0.5 rounded-full font-semibold border`. Chip de Mercado Inativo: `bg-slate-50 text-slate-400 border-slate-200 text-xs px-2 py-0.5 rounded-full border`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Criar a tela de listagem de canais de mercado no painel administrativo de configurações do CRM.
    2. [ ] Desenvolver o componente seletor de mercado para vinculação inline de novos leads comerciais.
    3. [ ] Criar filtros por mercado na barra superior de todas as tabelas de listagem de leads e relatórios de vendas.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Diretor Comercial de Vendas,  
    > **Quero** segmentar as metas comerciais entre os mercados "Residencial B2C" e "Industrial B2B",  
    > **Para** analisar quais frentes de mercado trazem propostas solares com maior margem de lucro e menor tempo de conversão.  
    *   **Pontuação Estimada (Story Points)**: **3 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Troca de mercado em lead ativo e impacto financeiro
      Dado que o lead está associado ao mercado "Residencial B2C" contendo valor de "R$ 25.000"
      Quando o vendedor altera o mercado para "Industrial B2B" e eleva o valor para "R$ 150.000"
      Então o sistema deve persistir as mudanças e recalcular as métricas de faturamento do pipeline de mercado B2B no painel financeiro
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface MarketSelectorProps {
      selectedMarketId: string;
      markets: { id: string; name: string; isActive: boolean }[];
      onChangeMarket: (id: string) => void;
    }
    ```
*   **Comportamento & Erros**: Ao salvar a alteração de mercado, desabilitar controles inline e exibir spinner de carregamento no seletor. Em caso de queda de conexão, disparar toast de erro com fundo vermelho e restaurar visualmente o mercado original sem alterar as métricas financeiras.

---

### 27. `organization-tags.png` (Mecanismo de Tags Globais para Identificação de Leads e Contas)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Fornecer um sistema flexível de rotulação (*tags*) para que vendedores criem marcadores comportamentais rápidos para categorizar leads e contatos (ex: "Hot Lead 🔥", "Usina de Solo", "Cliente Recomendado").
*   **Regra de Negócio Crítica**: Tags devem ser compartilhadas globalmente na plataforma para evitar duplicidades de ortografia (ex: "Agro" e "Agrobusiness" como tags separadas). A deleção administrativa de uma tag global deve removê-la automaticamente de todas as entidades associadas.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Tag "Hot Lead": `bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-xs px-2 py-0.5 shadow-sm`. Tag "Solo": `bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-xs px-2 py-0.5`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Criar a tela de gerenciamento de tags de organização com estatísticas de volumetria de uso de cada etiqueta.
    2. [ ] Desenvolver componente de inserção de tags em lote com auto-sugestão e criação inline de etiquetas novas (`TagInput`).
    3. [ ] Criar layouts de exibição de tags de forma visível em cards Kanban de leads de vendas e linhas de tabelas.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Consultor Comercial de Atendimento,  
    > **Quero** adicionar a tag "Hot Lead 🔥" e "Telhado Metálico" à oportunidade comercial,  
    > **Para** destacar o lead na listagem do Kanban e sinalizar a facilidade técnica de instalação para o time de engenharia.  
    *   **Pontuação Estimada (Story Points)**: **3 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Inserção de tag no lead com autocomplete
      Dado que o usuário está editando o input de tags da sidebar de detalhes do lead
      Quando ele digita "Ho" e seleciona a tag sugerida "Hot Lead 🔥" clicando em adicionar
      Então a tag deve ser inserida como um chip reativo contendo botão de remoção (x) e persistida automaticamente
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface TagInputProps {
      associatedEntityId: string;
      currentTags: string[];
      onAddTag: (tagName: string) => Promise<void>;
      onRemoveTag: (tagName: string) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Ao deletar uma tag através do botão de remoção (x) do chip, remover imediatamente a tag na UI com animação de esvanecimento (*fade-out*) de 150ms e persistir de forma assíncrona. Caso ocorra erro de servidor durante a remoção, recolocar a tag na interface de forma otimista e alertar o erro.

---

### 28. `organization-territories.png` (Definição de Regiões e Territórios de Vendas)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Cadastrar territórios comerciais baseados em limites geográficos (ex: "São Paulo Centro-Oeste", "Nordeste Solar", "Estado do Rio de Janeiro") para divisão e roteamento inteligente de leads entre representantes de vendas regionais.
*   **Regra de Negócio Crítica**: Leads ou Contas associados a um determinado CEP ou cidade devem ser distribuídos automaticamente para o respectivo território comercial cadastrado, vinculando o Lead ao vendedor responsável daquela região geográfica específica (*Auto-Routing Policy*).

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Item de Território na Tabela: `bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 shadow-sm flex items-center justify-between`. badge de Nome do Dono Regional: `bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a tela de cadastro administrativo de territórios geográficos vinculados a representantes de vendas.
    2. [ ] Criar componente de busca de CEP que preenche automaticamente o território sugerido baseado na regionalização.
    3. [ ] Criar filtros regionais geográficos em todos os relatórios analíticos de faturamento do pipeline solar.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Diretor de Vendas Solar B2B,  
    > **Quero** configurar o território de "Nordeste" e associá-lo ao representante comercial Felipe,  
    > **Para** que todas as simulações e leads gerados vindos da região Nordeste caiam automaticamente na carteira de Felipe de forma ágil.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Atribuição automática de lead baseado em CEP e território regional
      Dado que existe um território de vendas cadastrado chamado "SP Capital" de responsabilidade do vendedor Felipe
      Quando um visitante cria um lead inserindo CEP "01311-200" (São Paulo)
      Então o sistema deve associar o lead ao território "SP Capital" e marcar Felipe como proprietário automaticamente
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface TerritoryConfigProps {
      territories: { id: string; name: string; ownerName: string; postalCodePrefixes: string[] }[];
      onSaveTerritory: (data: any) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Validar se novos prefixos de CEP inseridos em territórios não entram em conflito ou sobreposição com territórios existentes na base. Se houver sobreposição geográfica, exibir caixa vermelha de erro informando que o CEP já pertence a outra região e indicar qual vendedor seria o responsável.

---

### 29. `pipeline.png` / `report-funnel.png` (Funil e Pipeline Visual de Vendas Kanban)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Visualização operacional do funil comercial, permitindo que vendedores monitorem e movimentem com facilidade suas oportunidades em andamento por meio de colunas Kanban organizadas por etapas de vendas.
*   **Regra de Negócio Crítica**: As colunas Kanban são estruturadas por metas (`Qualify`, `Pitch`, `Close`). Arrastar um lead para a coluna seguinte deve persistir a etapa no banco de dados e recalcular instantaneamente os valores somatórios financeiros no topo de cada coluna, além do valor total ponderado do pipeline no dashboard principal.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Layout das Colunas Kanban: `flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-180px)] select-none`. Estilo de Cada Coluna: `flex flex-col bg-slate-50 border border-slate-200 rounded-2xl w-80 h-full overflow-hidden flex-shrink-0`. Cartão de Lead: `bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing flex flex-col gap-2.5 w-full border-t-2`. Borda Superior de Confiança do Lead: "Baixo (Qualify)" -> `border-t-amber-400`; "Médio (Pitch)" -> `border-t-sky-400`; "Alto (Close)" -> `border-t-emerald-400`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Implementar a visualização Kanban responsiva com rolagem horizontal e colunas com cabeçalhos contendo soma de valores e contagem de leads.
    2. [ ] Desenvolver interatividade de arrastar e soltar cartões com efeitos visuais ao pairar cartões sobre as colunas (*drop-zone outline highlight*).
    3. [ ] Criar rodapé ou áreas especiais de soltura ao arrastar que marcam instantaneamente o lead arrastado como Ganho (Won) ou Perdido (Lost) com cores verde/vermelho transparentes.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Vendedor Comercial de Vendas Solar,  
    > **Quero** arrastar um lead comercial da coluna de "Qualify" para "Pitch",  
    > **Para** atualizar a etapa do projeto no sistema de forma intuitiva, sabendo que as especificações técnicas da usina já foram preenchidas por completo.  
    *   **Pontuação Estimada (Story Points)**: **8 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Arrastar lead e recalcular valores de colunas
      Dado que a coluna "Qualify" possui R$ 50.000 em leads e a coluna "Pitch" possui R$ 100.000
      Quando o usuário arrasta um lead de valor R$ 10.000 da coluna "Qualify" para a "Pitch"
      Então o sistema deve transicionar o cartão, reduzir "Qualify" para R$ 40.000, elevar "Pitch" para R$ 110.000 e persistir a etapa no servidor
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface KanbanColumnProps {
      milestone: 'Qualify' | 'Pitch' | 'Close';
      leads: { id: string; name: string; value: string; confidence: string }[];
      onDragOver: (e: React.DragEvent) => void;
      onDrop: (e: React.DragEvent, targetMilestone: 'Qualify' | 'Pitch' | 'Close') => void;
    }
    ```
*   **Comportamento & Erros**: Utilizar a API de Drag & Drop nativa do HTML5 ou bibliotecas otimizadas de React. Aplicar atualização otimista na interface movendo o cartão imediatamente. Caso a persistência da etapa na API retorne falha (ex: validação de campos obrigatórios não preenchidos), reverter o cartão na UI para a coluna de origem, restaurando os valores financeiros anteriores e disparando toast detalhado com a mensagem de validação do servidor.

---

### 30. `report-leads.png` / `reports.png` / `report-snapshop.png` (Hub de Relatórios e Dashboard Analítico Financeiro)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Centralizar o acompanhamento analítico de KPIs de faturamento e produtividade, permitindo que a diretoria comercial tome decisões estratégicas baseadas em dados em tempo real.
*   **Regra de Negócio Crítica**: O sistema deve calcular automaticamente métricas de faturamento consolidadas do pipeline baseadas na soma do valor dos leads ponderada pela confiança (*Weighted Pipeline Value*). Filtros por período (Data de Criação do Lead) e mercados devem recalcular os dados de forma instantânea.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Grid de Blocos Analíticos: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`. KPI Financeiro de Destaque: `text-3xl font-black text-slate-900 tracking-tight`. Card de Métrica Consolidadas: `bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a tela de consolidação de relatórios com layout em formato de dashboard e barra superior de filtros de data.
    2. [ ] Desenvolver gráficos integrados de funil e linha mostrando o histórico de leads criados e faturamento gerado por mês.
    3. [ ] Criar tabelas detalhadas de conversão e ticket médio por representante de vendas e regiões geográficas de atuação.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Diretor Comercial de RevOps,  
    > **Quero** visualizar o relatório consolidado de vendas do pipeline filtrado pelo mercado "Industrial B2B",  
    > **Para** analisar a taxa de conversão de usinas industriais e planejar a receita comercial esperada para o fechamento do trimestre.  
    *   **Pontuação Estimada (Story Points)**: **8 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Filtro de período e recálculo automático de faturamento
      Dado que o dashboard principal exibe R$ 1.500.000 em propostas solares ativas no ano de 2026
      Quando o usuário altera o filtro de data para o período de "Últimos 30 Dias"
      Então as métricas de faturamento e quantidade de leads abertos na tela devem recarregar exibindo apenas os dados correspondentes ao intervalo
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface ReportMetricsGridProps {
      totalPipelineValue: number;
      weightedPipelineValue: number;
      wonLeadsValue: number;
      conversionRatePercent: number;
    }
    ```
*   **Comportamento & Erros**: Ao realizar a seleção de novos filtros de data ou mercados, colocar as métricas analíticas e gráficos em estado de carregamento exibindo dados esmaecidos com spinner. Caso ocorra erro de carregamento nos relatórios analíticos complexos por timeout do backend, alertar com estado amigável e permitir botão simplificado de re-tentativa.

---

### 31. `sales-dashboard.png` (Dashboard Principal de Vendas e Agenda Operacional)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: A tela inicial padrão do CRM ao realizar o login, consolidando as informações cruciais para o dia de trabalho do vendedor: Metas de Vendas do mês, Tarefas Pendentes, Telefonemas agendados para o dia e feed de atualizações recentes.
*   **Regra de Negócio Crítica**: O bloco de "Month-to-Date (MTD)" de faturamento deve comparar de forma visual a receita real de usinas solares ganhas pelo corretor contra a meta individual mensal definida pela gerência comercial (*Quota Performance Policy*).

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Layout de Dashboard Geral: `max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8`. Tabela de Atividades do Dia: `bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm`. Linha de Atividade Agendada: `flex items-center justify-between py-3 px-4 border-b border-slate-100 last:border-none hover:bg-slate-50 transition-all`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a página inicial do Dashboard em grid de três colunas (Metas e Faturamento MTD, Atividades do Dia e Feed de Timeline Recente).
    2. [ ] Criar o componente de barra de progresso circular ou linear que exibe de forma clara a porcentagem de atingimento de metas.
    3. [ ] Criar botões rápidos de ação de conclusão de chamadas diretamente no painel inicial do corretor.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Consultor Comercial de Vendas Solar,  
    > **Quero** fazer login na plataforma e visualizar na tela inicial minhas ligações de qualificação marcadas para o dia e meu andamento de meta,  
    > **Para** planejar meu roteiro de contatos de forma eficiente, sem precisar vasculhar individualmente leads abertos na base.  
    *   **Pontuação Estimada (Story Points)**: **8 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Marcar atividade como concluída direto do Dashboard
      Dado que o vendedor visualiza a lista de atividades recomendadas para o dia no seu dashboard
      Quando ele clica no checkbox de uma ligação de qualificação de consumo de energia de um lead específico
      Então a atividade deve ser marcada como logged (concluída) com data atual e ser removida instantaneamente da lista pendente
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface SalesDashboardProps {
      currentUser: { name: string; monthlyQuota: number; mtdSalesValue: number };
      todaysActivities: { id: string; name: string; type: string; start_time: string; leadName: string }[];
    }
    ```
*   **Comportamento & Erros**: Utilizar carregamento paralelo assíncrono para os diferentes blocos de dados do dashboard. Se o bloco de atividades sofrer falha de API ao carregar, exibir estado amigável com imagem ou ícone ilustrativo com botão de recarga sem prejudicar o carregamento das metas e comissão financeira no bloco MTD superior.

---

### 32. `setting-tracking.png` / `trackkeing-seting.png` (Configurações de Scripts e Rastreamento de Leads)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Configurar e habilitar o código JavaScript que rastreia os acessos e navegação de leads quentes no site institucional e simulador fotovoltaico externo de faturas.
*   **Regra de Negócio Crítica**: O script de rastreamento deve associar as sessões anônimas de navegação aos dados do lead no CRM assim que o contato preencher um formulário com e-mail cadastrado na base. A partir desse momento, as páginas e frentes visualizadas pelo cliente de energia solar no site institucional devem ser sincronizadas como atividades de visualização na timeline de detalhes do lead (*Site Tracking Sync*).

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Bloco de Visualização de Código JS: `font-mono bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 text-xs shadow-inner select-all overflow-x-auto leading-relaxed`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a tela administrativa de controle de script de monitoramento com toggles de controle e lista de domínios cadastrados e autorizados.
    2. [ ] Criar componente visual de código de incorporação com botão integrado de cópia de texto com feedback animado.
    3. [ ] Criar painel indicador de saúde mostrando se o script de rastreamento se encontra ativo e coletando dados nos domínios autorizados.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Gerente de Marketing e Growth Solar,  
    > **Quero** cadastrar o domínio institucional e copiar o script de rastreamento gerado pelo CRM,  
    > **Para** embuti-lo no site e identificar quando os leads quentes acessam a página de precificação de usinas, alertando os consultores comerciais de vendas.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Cópia rápida de código JS de rastreamento com feedback
      Dado que o usuário está na tela administrativa de rastreamento do site
      Quando ele clica no botão "Copy Script" posicionado ao lado do bloco de código JS
      Então o texto do script deve ser copiado para a área de transferência e o botão deve exibir temporariamente "Copiado!" com cor verde por 2 segundos
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface SiteTrackingSettingsProps {
      domain: string;
      trackingCode: string;
      isLive: boolean;
      onSaveDomain: (domain: string) => Promise<void>;
    }
    ```
*   **Comportamento & Erros**: Validar se o domínio cadastrado segue padrões regulares de URLs válidas (ex: sem HTTP/HTTPS ou diretórios de páginas no final). Ao salvar o domínio, realizar chamada de validação na API e, se a rede sofrer queda, reter o formulário desbloqueado alertando o usuário e preservando o domínio inserido para re-tentativa ágil de gravação.

---

### 33. `setting.png` (Hub Geral de Configurações Administrativas do CRM)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Central de comando e controle administrativo, reunindo todos os painéis de parametrização e manutenção de políticas comerciais de dados do sistema em uma barra lateral dedicada.
*   **Regra de Negócio Crítica**: O acesso ao Hub de Configurações Administrativas deve ser restrito por políticas RBAC estritas, sendo acessível unicamente a usuários cadastrados como Administradores ou Gerentes de Vendas, retornando erro de autorização apropriado para vendedores convencionais.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Menu Lateral de Opções (Sidebar de Configurações): `w-64 border-r border-slate-200/80 bg-slate-50 flex flex-col gap-1 p-3 select-none h-full`. Item de Menu Selecionado: `bg-white text-slate-900 border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold transition-all shadow-sm`. Item de Menu Inativo: `text-slate-500 hover:text-slate-800 rounded-lg py-2 px-3 text-xs font-semibold hover:bg-slate-100 transition-all`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar o layout do painel geral dividido com menu lateral administrativo de opções e painel direito dinâmico contendo a tela de configurações selecionada.
    2. [ ] Criar componente de cabeçalho do painel indicando o contexto administrativo da tela e atalhos rápidos de navegação.
    3. [ ] Implementar regras de responsividade com menu hambúrguer recolhível para otimizar visualização do painel em telas menores e tablets.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Diretor Administrativo de Vendas Solar,  
    > **Quero** acessar o painel administrativo de configurações do CRM,  
    > **Para** navegar facilmente entre as parametrizações de integrações de chat, campos customizados e regras regionais de distribuição de leads.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Bloqueio de acesso a configurações para usuários comuns
      Dado que o vendedor comum Felipe está logado no sistema e tenta acessar a rota administrativa `/settings`
      Quando a rota é carregada
      Então o sistema deve interceptar a navegação, exibir tela de bloqueio com mensagem de erro informando privilégios insuficientes e link rápido para retornar ao dashboard comercial
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface SettingsHubProps {
      currentSection: 'api_keys' | 'custom_fields' | 'tags' | 'chat';
      onChangeSection: (section: 'api_keys' | 'custom_fields' | 'tags' | 'chat') => void;
      userRole: 'admin' | 'sales_rep';
    }
    ```
*   **Comportamento & Erros**: Utilizar roteamento dinâmico assíncrono para os diferentes submódulos de configurações. Caso o carregamento de uma determinada página administrativa apresente erro de servidor, carregar mensagem amigável no painel direito sem comprometer o menu lateral de opções e a usabilidade geral da aplicação.

---

### 34. `step2.png` / `step3.png` (Passos do Assistente e Integração de Fluxos de Automação)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Sequência de passos estruturados (Assistente Wizard) focado na configuração inicial de automações de vendas, captação digital e simulação fotovoltaica externa.
*   **Regra de Negócio Crítica**: O fluxo do assistente deve ser dinâmico e obrigatório em sua progressão. O usuário não deve conseguir avançar para o passo seguinte (`step3`) sem preencher com sucesso todos os campos de parametrização solicitados e validados no passo anterior (`step2`).

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Indicador de Progresso (Passo Ativo): `bg-slate-900 text-white rounded-full flex items-center justify-center w-8 h-8 font-bold text-xs border-2 border-slate-900 shadow-sm`. Passo Incompleto Futuro: `bg-white text-slate-400 border-2 border-slate-200 rounded-full flex items-center justify-center w-8 h-8 font-semibold text-xs`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a barra superior de acompanhamento de passos do assistente com indicadores circulares numerados e conexões de progresso fluidas.
    2. [ ] Desenvolver botões horizontais de navegação ("Voltar" e "Avançar") ao rodapé do painel com transições suaves de fade-in.
    3. [ ] Criar caixa de aviso de preenchimento pendente com alertas em tons de vermelho/laranja para campos de setup inválidos.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** SDR de Atendimento Comercial,  
    > **Quero** preencher o assistente passo a passo de setup de simulações integradas,  
    > **Para** garantir que os testes de webhooks de captação digital do site estejam funcionando antes de liberar a landing page corporativa de vendas solar.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Progresso do passo 2 para o passo 3 com validação ativa
      Dado que o usuário está no assistente no "Step 2: Configuração de Domínio" e o campo de URL está em branco
      Quando ele clica no botão "Avançar" para prosseguir para o passo 3
      Então o sistema deve travar a navegação, focar no campo de URL pendente e exibir mensagem em vermelho avisando preenchimento obrigatório
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface WizardStepProps {
      activeStep: 2 | 3;
      stepData: { domain: string; isWebhookVerified: boolean };
      onNextStep: () => void;
      onPrevStep: () => void;
    }
    ```
*   **Comportamento & Erros**: Utilizar tratamento de estado persistido temporariamente no lado do cliente (`sessionStorage` ou gerenciador de estado React) para manter os dados preenchidos pelo corretor intactos ao transicionar entre as abas do assistente, evitando perdas acidentais de textos ao clicar em "Voltar" para revisar configurações.

---

### 35. `windowcrm.png` (Módulo Integrado de Janelas Flutuantes e Central de Notificações Internas)
#### A. Visão do Produto & Regras de Negócio (PRD)
*   **Propósito**: Central de notificações internas, que exibe de forma flutuante e instantânea alertas sobre interações recentes (ex: e-mail de simulação de telhado aberto pelo cliente, telefonemas pendentes agendados pela SDR ou leads novos direcionados).
*   **Regra de Negócio Crítica**: O painel de alertas rápidos deve ser atualizado de forma dinâmica através de web sockets em tempo real. O clique em uma determinada notificação deve transicionar instantaneamente o corretor para o detalhe da oportunidade ou contato associado para ação imediata de contato.

#### B. Design System & UI/UX Task List
*   **Design Tokens**: Bloco de Notificação Flutuante: `fixed bottom-4 right-4 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 flex gap-3 max-w-sm w-full z-50 animate-in slide-in-from-bottom duration-200 border-l-4 border-l-slate-900`. Título da Notificação: `font-bold text-slate-800 text-sm`. Texto da Notificação: `text-xs text-slate-600 leading-relaxed`.
*   **Lista de Tarefas de UI/UX**:
    1. [ ] Projetar a central de notificações com menu dropdown flutuante posicionado ao canto superior direito da Topbar principal.
    2. [ ] Criar indicador visual de novos alertas com badge circular vermelho exibindo a contagem sobreposta ao ícone de sino (🔔).
    3. [ ] Criar botão rápido de limpar em lote marcando todos os alertas como lidos com um clique.

#### C. User Story, Story Points e Critérios de Aceite
*   **User Story**: 
    > **Como** Consultor Comercial de Vendas Solar,  
    > **Quero** visualizar um balão de notificação em tempo real quando o lead abrir o e-mail de simulação de proposta comercial fotovoltaica,  
    > **Para** que eu ligue imediatamente para o cliente para tirar dúvidas, aproveitando o momento exato de interesse.  
    *   **Pontuação Estimada (Story Points)**: **5 SP**
*   **Critérios de Aceite (Gherkin)**:
    ```gherkin
    Cenário: Recebimento de websocket e abertura de lead correspondente
      Dado que o vendedor comercial está trabalhando em qualquer tela do CRM
      Quando o webhook do provedor de e-mail registra que o cliente abriu a proposta solar
      Então um balão de alerta deve subir ao canto direito da tela de forma suave, e ao clicar no alerta o vendedor deve ser levado ao lead correspondente
    ```

#### D. Componentes React & Comportamentos
*   **Componente React**:
    ```tsx
    interface NotificationItemProps {
      notification: { id: string; title: string; message: string; leadId?: string; isRead: boolean; createdAt: string };
      onMarkRead: (id: string) => void;
      onNavigateToLead: (leadId: string) => void;
    }
    ```
*   **Comportamento & Erros**: Utilizar animações nativas de transição suave baseadas em propriedades de translate e opacidade. Se a conexão de rede com os servidores de websocket sofrer quedas temporárias, o componente de sino na Topbar deve alterar de forma suave seu status visual para um ícone desconectado cinza com barra transversal, reestabelecendo a escuta de web sockets automaticamente assim que a rede se normalizar.
