# Auditoria de Segurança e Isolamento da API de Ranking (W12 / API-002)

- **Status:** Aprovado e Auditado.
- **Escopo:** Endpoints `/api/v1/company_dashboard/analytics/ranking` e `/filter_options`.

---

## 1. Verificação contra IDOR (Insecure Direct Object Reference)

- **Controle Implementado:** Pundit policy `authorize @company, :view_analytics_ranking?`.
- **Mecanismo:** A empresa é carregada pelo tenant do usuário logado via `current_user.companies` ou validada através do token JWT autenticado.
- **Resultado:** Uma empresa A não consegue consultar o dashboard analítico nem os relatórios de ranking privados da empresa B. Parâmetros forçados com `company_id` divergente do tenant autorizado são barrados com status `403 Forbidden` pelo Pundit.

---

## 2. Isolamento de Diagnósticos Anti-Fraude e Anti-Abuso

- **Risco Auditado:** Vazamento de regras heurísticas, limiares de spam, IPs ou métricas de auditoria interna que permitam engenharia reversa do algoritmo por empresas mal-intencionadas.
- **Mitigação no Payload:**
  - O campo `manifest` publica apenas o `release: '2.0.0'`, nome da metodologia (`organic-performance-v2`) e o SHA-256 `parameter_digest`.
  - Nenhuma regra interna de detecção de click-fraud ou anomalia é exposta no JSON retornado.
  - As razões de fallback de escopo (`scope_ladder_fallback`) informam apenas a necessidade de agregação territorial por tamanho de amostra amostral mínima (`insufficient_population`), sem expor dados internos sensíveis.

---

## 3. Privacidade e Proteção de Dados de Competidores (LGPD)

- No benchmark de competidores e posicionamento (`quadrant.points`), apenas identificadores públicos de mercado são exibidos (nome fantasia, cidade/UF da sede e scores agregados normalizados).
- Informações contratuais, dados de faturamento, dados pessoais de fundadores/sócios ou contatos diretos permanecem estritamente isolados fora do subsistema de ranking.

---

## 4. Contrato Aditivo e Retrocompatibilidade

- Todas as chaves introduzidas no Ranking v2 (`manifest`, `requested_scope`, `resolved_scope`, `scope_ladder_fallback`, `snapshot_freshness`) são estritamente aditivas.
- Clientes legados (Mobile Expo e versões anteriores do frontend) continuam consumindo os campos `rank_position`, `ranking_score`, `transparency` e `benchmarks` sem qualquer quebra de tipagem.
