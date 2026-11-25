# PRD / PDR — Produto e entrega
Problema: agentes criam UI divergente, componentes duplicados, dependências pesadas e fluxos inconsistentes. Usuários: consumidor buscando integradores, equipe de produto/engenharia, empresa assinante (fase futura). Proposta: componentes de domínio homologados, identidade consistente, catálogo pesquisável e experiências MCP verificáveis.

| Objetivo | Métrica/target | Medição |
|---|---|---|
| Reuso | 100% dos novos blocos documentados no registry | Manifest e imports |
| Compatibilidade | 5 superfícies existentes sem regressão | Testes e smoke |
| Qualidade visual | 0 overflow da página, 0 axe grave/crítico | Matriz de viewports |
| Performance | ≤122880 B gzip por HTML | Build gate |
| Confiança | 0 valores fictícios em produção, unknown explícito | Testes de schema |
| Governança | 0 nova ação sem política; 0 novos processos VM | Review de arquitetura |

Sucesso do MVP não depende de conversão comercial real; estabelecer baseline antes de fixar metas de conversão/engajamento. Eventos só quando ação realmente ocorrer e consentimento/política permitir; evitar contagem duplicada de eventos. Após staging, medir render success, erro de tool, tempo de render, clique de perfil e compare agregado; documentar denominador e janela. Não comercializar ranking como garantia de qualidade.
