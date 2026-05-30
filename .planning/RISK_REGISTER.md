# RISK REGISTER — Gerenciamento e Mitigação de Riscos Técnicos

Este documento registra e quantifica os riscos técnicos da refatoração da página de perfil comercial, detalhando as medidas preventivas para atingir risco zero.

---

## Matriz de Riscos

| Risco Mapeado | Impacto | Probabilidade | Medida de Mitigação Preventiva |
|---------------|:---:|:---:|--------------------------------|
| **1. Quebra de Rotas Indexadas** <br> *Mudanças inadvertidas nas URLs de perfil podem quebrar links legados no Google.* | 🔴 Alto | 🟢 Baixa | Preservar integralmente a captura por `[id]` Next.js, aceitando slugs textuais e IDs numéricos, consultando o endpoint `/by_slug/:slug` com fallback. |
| **2. Exibição Indevida de Dados Premium** <br> *Vazamento de blocos Pro (analytics, simulador) para planos Free.* | 🔴 Alto | 🟡 Média | **Verificação estrita no frontend** por chaves lidas diretamente do `company.feature_access` canonizado do Rails, bloqueando o componente se `state !== 'enabled'`. |
| **3. Latência de Carregamento** <br> *Interface pesada devido a gráficos de estatísticas, fotos de galeria e projetos.* | 🟡 Médio | 🟡 Média | **Carregamento preguiçoso (*lazy-loading*)** dos componentes pesados via Next.js Dynamic Imports, mantendo o primeiro render instantâneo. |
| **4. Incompatibilidade com Active Admin** <br> *Falha ao processar campos customizados salvos no painel admin.* | 🔴 Alto | 🟢 Baixa | **Testar seeds de plans** locais integrados aos models Rails antes do commit final. Manter a modelagem de tabelas legadas intocada. |
| **5. Quebra de Mobile e Overflow** <br> *Elementos horizontais do Hero ou tabs quebrando tela de 320px.* | 🟡 Médio | 🟡 Média | **Design Mobile-First** estrito usando `flex-wrap` ou `ScrollArea` horizontais para as abas, homologados no Playwright. |
