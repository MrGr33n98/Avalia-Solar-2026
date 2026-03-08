# Auditoria de Sitemap e Intent Data - Avalia Solar 2026

## 1. Sitemap da Plataforma (Arquitetura)

### Core User Experience (B2C)
- **Home**: `/`
- **Marketplace**: `/companies`
  - Perfil da Empresa: `/companies/[slug]`
  - Filtro por Categoria: `/companies/categorias/[category-segment]`
- **Categorias**: `/categories`
  - Landing de Categoria: `/categories/[seo_url]`
- **Produtos**: `/products`
  - Detalhe: `/products/[id]`
  - Comparador: `/compare`
- **Conteúdo**: `/blog`
  - Post: `/blog/[slug]`

### Autenticação e Usuário
- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/dashboard` (User Dashboard)

### B2B e Admin
- `/company-dashboard` (Dashboard da Empresa Instaladora)
- `/admin` (Backend Administrativo Rails)

---

## 2. Mapa de Intent Data (Taxonomia de Eventos)

Os dados de intenção são capturados em 3 camadas: **GA4** (Web Vitals/Traffic), **Mixpanel** (Product Analytics) e **Internal API** (Conversões Diretas).

### Camada 1: Bottom of Funnel (Intenção Direta de Fechar Negócio)
| Evento | Significativo | Atributos de Intenção |
| :--- | :--- | :--- |
| `Lead Form Submitted` | Cadastro finalizado no Wizard | `lead_id`, `company_id`, `form_type`. |
| `WhatsApp Clicked` | Clique no link de conversa direta | `company_id`, `phone_number`. |
| `Quote Request Clicked` | Clique no botão de orçamento rápido | `cta_location`, `company_name`. |
| `Wizard Verified` | Lead confirmou e-mail/OTP | Indica Lead de alta qualidade (High Intent). |

### Camada 2: Middle of Funnel (Pesquisa e Comparação)
| Evento | Significativo | Atributos de Intenção |
| :--- | :--- | :--- |
| `Comparison Add/Remove` | Adição de empresas ao comparador | Identifica o "Consideration Set" do usuário. |
| `Product Click` | Clique em detalhe de painel/inversor | Interesses específicos em marcas (WEG, Canadian, etc). |
| `ROI Expand` | Abriu explicação de retorno financeiro | Interesse em viabilidade econômica. |
| `Location Selected` | Filtrou por cidade específica | Define a "Zona de Demanda" Geográfica. |

### Camada 3: Top of Funnel (Engajamento e Conhecimento)
| Evento | Significativo | Atributos de Intenção |
| :--- | :--- | :--- |
| `Blog Scroll Depth` | Até onde leu o artigo (25, 50, 75%) | Define o nível de interesse no tópico (ex: "Baterias"). |
| `Newsletter Submit` | Cadastro na newsletter do blog | Interesse recorrente em energia solar. |
| `Calculator Used` | Usou a calculadora de economia solar | Intenção exploratória baseada em valor de conta de luz. |
| `Premium Banner Viewed`| Visualização de banners de destaque | Mede a autoridade visual das empresas parceiras. |

---

## 3. Micro-Intents Adicionais
O sistema também trackeia:
- **Share Intent**: `blog_share_click` e `company_share_click` (Usuário recomendando a plataforma).
- **Ranking Intent**: `ranking_click` (Usuário buscando as "Top Rated").
- **Web Vitals**: `web_vital` (Impacto da performance na conversão).
- **Regional Data Revealed**: `regional_data_exposed` (Quando o usuário vê os números de sua região).

## 4. Rastreamento Externo (Pixels e GTM)
A plataforma está preparada para integrar:
- **Google Tag Manager (GTM)**: Centraliza disparos de tags sem mexer no código.
- **GA4 (Measurement Protocol)**: Eventos do lado do servidor (através do `AnalyticsTrackingJob` no Rails) para evitar perdas por AdBlockers.
- **Mixpanel**: Tracking de jornada do usuário para entendimento de retenção.
- **Sentry**: Captura de erros de JavaScript que impedem a intenção de conversão.

## 5. Dinâmica do Sitemap
Diferente de um arquivo estático, o nosso `sitemap.ts` em `/AB0-1-front/app/sitemap.ts` é **autorregenerativo**:
- **Empresas**: Atualmente mapeia as primeiras 100 empresas ativas (SEO-optimized slugs).
- **Blog**: Mapeia posts dinamicamente via API.
- **Categorias**: Mapeia todas as SEO URLs de categorias cadastradas no banco.
- **Frequência**: Configurado para `daily` (Home/Empresas) e `weekly` (Blog/Categorias).

## 6. Diagnóstico de Melhoria e Próximos Passos
- **Implementação Sugerida**: Tracking de `Form Abandonment` (em qual campo o usuário desiste).
- **Implementação Sugerida**: Evento de `Lead Quality Score` baseado no comportamento pré-conversão.
## 7. Camadas de Lógica Avançada (Deep Engine)

### Algoritmo de Matchmaking de Leads (`LeadDistributionService`)
A plataforma não entrega leads de forma aleatória. Existe um sistema de **Cascata de Prioridade**:
1. **Match Geográfico Preciso**: Busca empresas verificadas na mesma Cidade/Estado.
2. **Monetização (Pay-to-Play)**: Empresas `sponsored` e com maior `priority_score` aparecem no topo do "Consideration Set".
3. **Limite de Fricção**: O sistema limita a distribuição a exatamente **3 empresas** por lead, equilibrando escolha para o usuário e conversão para o parceiro.

### Engine de Conversão Dinâmica (`CompanyCtaBuilder`)
Os botões de contato são "vivos":
- **Templates de Mensagem**: Permite que a empresa pré-defina mensagens de WhatsApp que usam variáveis como `{city}` ou `{company_name}`, removendo a barreira do "não sei o que escrever".
- **Context Awareness**: Diferencia CTAs entre a visualização em lista (Card) e a visualização detalhada (Profile).
- **Auto-UTM**: Injeta automaticamente parâmetros de rastreio em links externos para que a empresa saiba que o cliente veio do Avalia Solar.

### Integridade e Reconciliação de Dados
O sistema possui uma camada de **Auditoria em Tempo Real**:
- **Cross-Check**: O `SlackNotificationService` dispara alertas críticos se houver discrepância entre os logs brutos e as estatísticas agregadas (Data Reconciliation).
- **Operational Heartbeat**: Notificações instantâneas de novos leads e reviews permitem que o time administrativo monitore a "saúde" do marketplace minuto a minuto.

## 8. Conclusão da Auditoria
A plataforma Avalia Solar 2026 está operando com um nível de sofisticação de **Enterprise SaaS**, integrando UX inteligente (Frontend), Automação de Negócios (Matchmaking) e Integridade de Dados (Reconciliation).

**Status Final**: Infraestrutura validada e mapeada.
