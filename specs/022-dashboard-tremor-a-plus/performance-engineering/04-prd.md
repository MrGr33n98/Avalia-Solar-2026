# PRD / PDR — Dashboard Performance A+++
Problema: latência percebida ao navegar, custo de renderização, refetch e instabilidade possíveis; validar magnitude no D0. Usuários: proprietário/admin de empresa, operador comercial, analista, avaliador, suporte autorizado; contextos Free/Essencial/Pro/Enterprise conforme backend real. Escopo: app autenticado inteiro, prioridade empresa 372 autorizada, depois CRM/Reviewer; sem alterar marketplace público ou MCP.
## Requisitos funcionais
FR1 navegação imediata com feedback e URL canônica, history/back/forward preservados. FR2 shell persistente e estados por seção; conteúdo crítico antes de gráficos secundários. FR3 queries deduplicadas, canceláveis ou descartadas quando obsoletas; refresh seletivo. FR4 isolamento por tenant, sessão, permissão e parâmetros. FR5 filtros/paginação e drawers consistentes sem refetch desnecessário. FR6 gráficos/tabelas pesados carregados quando relevantes; acessibilidade e alternativa textual. FR7 offline/error/empty/locked distintos; retry controlado; sem zeros inventados. FR8 telemetria sem PII. FR9 paridade integral de funcionalidades e pricing/ranking existentes. FR10 Tremor inspiração apenas; zero novas dependências estéticas.
## User stories / BDD
US-P01 membro abre deep link B com A salvo: dado acesso válido e seleção em andamento, quando abrir B, então só B aparece após confirmação; nenhum payload A renderizado no contexto B.
US-P02 gestor troca Overview→Ranking→Overview: dado dados ainda frescos, então feedback imediato, shell não remonta e retorno reutiliza cache autorizado.
US-P03 analista muda filtro 10 vezes: apenas último resultado válido aparece, requisições antigas são canceladas/descartadas; nenhum erro de cancelamento como falha de negócio.
US-P04 operador recebe eventos em rajada: conteúdo pertinente atualiza com coalescência e sem invalidar permissões sem motivo; mudança real de acesso continua fail-closed.
US-P05 usuário em rede lenta: shell e controles úteis ficam disponíveis; gráficos mostram skeleton local de dimensões estáveis; retry independente.
US-P06 assinante sem acesso: aba bloqueada explica plano; nenhum request privado de recurso bloqueado.
US-P07 usuário com reduced motion: sem transições supérfluas, navegação e foco preservados.
US-P08 operador com tabela grande: paginação/virtualização conforme medição, busca e ordenação corretas, teclado e exportação coerentes.
US-P09 sessão expira/troca empresa: cache privado é invalidado conforme política e nenhuma informação antiga é exibida.
US-P10 engenheiro: CI reporta antes/depois por rota e falha em regressão acima do budget aprovado.
## Não objetivos
Upgrade global React/Next/Tailwind; Redis novo por estética; reescrever backend; desativar telemetria/gates; cache público de dados privados; pré-carregar todo app; alterar ranking ou preços. Não prometer latência de rede impossível; medir e explicitar dependências.
