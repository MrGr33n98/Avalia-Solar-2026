# AI Visibility Report (AEO / GEO) — Avalia Solar 2026
**Auditoria de Visibilidade em Mecanismos de IA, Agentes e Modelos Generativos**  
**Data:** 26 de Novembro de 2026  

---

## 1. Evidências Empíricas de Tráfego de Agentes de IA

Os relatórios do GA4 revelaram acessos reais de motores de IA navegando no Avalia Solar:

| Origem / Mídia | Usuários Ativos | Sessões | Taxa de Engajamento | Interpretação |
|---|---:|---:|---:|---|
| `chatgpt.com / internal` | 1 | 7 | 100,0% | Agente de navegação web da OpenAI executando pesquisa de citações. |
| `chatgpt.com / ai-assistant` | 4 | 5 | 60,0% | Usuários humanos clicando em links recomendados pelo ChatGPT. |
| `perplexity / (not set)` | 1 | 1 | 100,0% | Usuário indicado por busca generativa do Perplexity AI. |
| **Total de Sessões de IA Identificadas** | **6** | **13** | **84,6%** | **Engajamento superior à média do site (84,6% vs 74,8%)** |

> **Conclusão:** O Avalia Solar já é ativamente lido e citado por motores de IA generativa (ChatGPT e Perplexity), gerando tráfego com engajamento extremamente elevado (tempo médio de permanência superior a 5 minutos).

---

## 2. Diagnóstico AEO (Answer Engine Optimization)

* **Capacidade de Resposta Rápida:**
  * O site possui páginas de dados locais (`/companies/energia-solar/[uf]/[city]`) com métricas quantitativas concretas de irradiação solar e economia estimada, muito valorizadas por IAs.
* **Gaps de AEO:**
  * **Ausência de FAQPage Schema:** Falta marcação estruturada de perguntas e respostas nas páginas institucionais e de categorias.
  * **Falta de Tabelas Comparativas HTML Nativas:** Muitas comparações entre fabricantes são feitas via componentes de cards JavaScript, dificultando a extração semântica por crawlers de IA.

---

## 3. Diagnóstico GEO (Generative Engine Optimization)

* **Sinais E-E-A-T (Experiência, Expertise, Autoridade e Confiabilidade):**
  * As avaliações de consumidores verificados (com fotos e dados de instalação) são o principal ativo defensável contra alucinações de IA.
  * **Gaps de GEO:**
    * Os artigos do blog carecem de perfis de autor detalhados com credenciais do setor elétrico/solar (Schema `Person` com `sameAs` para LinkedIn).
    * Ausência de referências a fontes oficiais como ANEEL, ABSOLAR e CCEE estruturadas com links externos.

---

## 4. Oportunidade: Agentic Storefront & Arquitetura MCP

O Avalia Solar possui servidores MCP implementados (`infra/MCP_CONFIG.json` e `packages/ui-registry`), além de ferramentas como `search_companies` e `get_company_profile`.

### Estratégia de Distribuição para Agentes:
1. **Publicação do arquivo `/llms.txt`:**
   * Disponibilizar na raiz do domínio um índice simplificado em Markdown formatado especificamente para LLMs (como Claude, ChatGPT e Perplexity), listando as categorias, principais empresas com selo verificado e métodos de consulta.
2. **Endpoint Público MCP Seguro:**
   * O Agentic Storefront (SPEC 026) permitirá que agentes autônomos consultem o inventário, especificações técnicas e reputação de instaladores solares em tempo real via chamadas de ferramentas seguras com proveniência garantida.
3. **Telemetria de Consultas de IA:**
   * Adicionar dimensão customizada `ai_agent_type` nos logs de acesso e no GA4 para diferenciar o tráfego de agentes do tráfego de usuários humanos.

