# User stories / BDD
Cada história requer teste Given/When/Then e evidência em staging sintético. IDs associados a tasks e acceptance.
| ID | Como / quero / para | Given → When → Then |
| --- | --- | --- |
| US01 | Owner abrir link de empresa | A e B autorizadas, B persistida → URL A → A renderiza somente após autorização, sem flash B |
| US02 | Membro impedir acesso indevido | Somente A → URL B → 403/seleção segura; nenhuma query/response B |
| US03 | Owner alternar empresa | A e B → troca durante request A → resposta atrasada A ignorada, filtros/seleção limpos |
| US04 | Analista navegar com teclado | Menu autorizado → busca/Enter/back → destino correto, focus e URL preservados |
| US05 | Owner ler desempenho | Período selecionado → KPI e gráfico → mesmo período, fonte e estados claros |
| US06 | Analista exportar | Filtros ativos → export → dados do tenant/período, sem fórmulas CSV |
| US07 | Marketing responder avaliação | Avaliação autorizada → responder → resultado real, erro tratável, sem duplicação |
| US08 | Marketing coletar avaliação | Plano permitido → criar link/QR/email → prévia e resultado; sem envio inesperado |
| US09 | Owner publicar produto | Rascunho válido → publicar → estado e limites reais, lista atualizada |
| US10 | Owner cadastrar projeto/material | Arquivo válido → upload → progresso, moderação; inválido bloqueado |
| US11 | Comercial encontrar lead | Busca/filtro → abrir drawer → detalhes e retorno preservam filtro |
| US12 | Comercial enviar proposta | Lead elegível → wizard/revisão/envio → confirmação e sem duplicidade |
| US13 | Comercial responder inbox | Mensagem em ambiente sintético → responder → estado real/retry sem duplicação |
| US14 | Analista estudar intenção | Plano autorizado → subtab/filtros → metodologia, cobertura e freshness; sem PII indevida |
| US15 | Owner entender ranking | Filtros válidos → ranking → evidências/erro; sem mudança de fórmula |
| US16 | Marketing instalar tracking | Permissão → copiar tag/UTM → valor correto; segredo não exposto |
| US17 | Owner administrar plano | Plano atual → upgrade/cancel autorizado → preço e período reais, confirmação |
| US18 | Admin gerir equipe | Permissão → convite/role → validação backend, sem escalada |
| US19 | Operador CRM gerir pipeline | Tenant autorizado → mover negócio via teclado ou drag → estado persistido/reversão |
| US20 | Operador CRM gerir campanha | Prévia/teste → revisão → enviar somente após ação autorizada; teste não envia real |
| US21 | Reviewer acessar jornada | Sem membership → dashboard reviewer → sem dados empresariais |
| US22 | Reviewer com membership | Role review + membership → URL empresa autorizada → contexto empresa preservado |
| US23 | Mobile executar tarefa | 390px/teclado → filtro/drawer/form → sem corte, safe area, foco |
| US24 | Usuário offline | Perda conexão → banner/erro → retry seguro sem mutação duplicada |
| US25 | Admin suporte autorizado | Impersonation permitida e auditável → tenant alvo → autorização explícita e saída segura |
| US26 | Usuário com plano restrito | Feature bloqueada → CTA → plano necessário real; API continua 403 |
| US27 | Usuário acessar tema | Light/dark/reduced motion → navegação → contraste e foco preservados |
| US28 | Operador gerenciar credenciais | Chaves/integrações → mascarar por padrão → ação autorizada e auditada; nunca logar segredo |
