# Quick Wins — Avalia Solar 2026
**Ações Imediatas de Alto Impacto e Baixo Esforço**  
**Data:** 26 de Novembro de 2026  

---

## 1. Tabela de Quick Wins Consolidados

| # | Ação | Onde Executar | Impacto | Esforço | Prazo de Execução |
|---|---|---|:---:|:---:|:---:|
| **QW-01** | **Mudar Moeda para BRL (R$)** | Painel GA4 Admin (*Configurações da Propriedade*) | Alto | 1 min | Imediato |
| **QW-02** | **Excluir Referências OAuth (`accounts.google.com` e `zoho`)** | Painel GA4 Admin (*Fluxo de Dados > Configurações de tags > Listar referências indesejadas*) | Altíssimo | 3 min | Imediato |
| **QW-03** | **Configurar Key Events no GA4 (`generate_lead`, `contact`, `whatsapp_click`)** | Painel GA4 Admin (*Eventos > Marcar como evento-chave*) | Altíssimo | 5 min | Imediato |
| **QW-04** | **Cadastrar as 20 Dimensões Personalizadas** | Painel GA4 Admin (*Definições personalizadas > Dimensões personalizadas*) | Alto | 15 min | Imediato |
| **QW-05** | **Bloquear Tráfego de `localhost` no GA4** | Código `AB0-1-front/lib/analytics/gtag.ts` + Filtro GA4 | Alto | 10 min | Sprint Atual |
| **QW-06** | **Corrigir Timeout do Sitemap de Empresas (503)** | Código `AB0-1-front/lib/seo/sitemap-builders.ts` (Particionamento ou limite seguro) | Altíssimo | 30 min | Sprint Atual |
| **QW-07** | **Configurar `GA4_API_SECRET` no Backend Rails** | Variáveis de ambiente de produção (Docker Compose / GHCR) | Alto | 5 min | Sprint Atual |
| **QW-08** | **Liberar Acesso do E-mail ADC no Google Search Console** | Painel do Google Search Console (*Usuários e permissões*) | Alto | 2 min | Imediato |
| **QW-09** | **Publicar `/llms.txt` na raiz para Descoberta de IA** | Frontend `public/llms.txt` | Médio | 20 min | Sprint Atual |
| **QW-10** | **Adicionar Schema `FAQPage` na Homepage** | Frontend `app/page.tsx` | Médio | 30 min | Sprint Atual |

---

## 2. Passo a Passo de Execução dos Quick Wins Críticos (Sem Código)

### QW-01: Correção de Moeda
1. Acesse https://analytics.google.com/ com a conta administradora.
2. Selecione a propriedade `424024013`.
3. Navegue até **Administrador > Configurações da propriedade > Detalhes da propriedade**.
4. Altere o campo **Moeda exibida como** de `Dólar americano ($)` para `Real brasileiro (R$)`.
5. Salve as alterações.

### QW-02: Eliminação do Roubo de Atribuição por OAuth
1. No painel de Administração do GA4, selecione **Fluxos de dados > Fluxo da Web (Avalia Solar)**.
2. Clique em **Definir configurações de tags**.
3. Clique em **Mostrar mais** e selecione **Listar referências indesejadas**.
4. Adicione as seguintes regras:
   * *O domínio de referência contém:* `accounts.google.com`
   * *O domínio de referência contém:* `accounts.zoho.com`
   * *O domínio de referência contém:* `avaliasolar.com.br`
5. Salve. As novas sessões não serão mais reiniciadas ao passar pelo login Google ou CRM.

