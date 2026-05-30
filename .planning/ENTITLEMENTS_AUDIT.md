# ENTITLEMENTS AUDIT — Regras de Acesso e Exibição por Plano

Este documento consolida as permissões exatas e as regras de exibição por plano (Free, Essential, Pro, Enterprise) com base nas constantes e lógicas do backend do Avalia Solar.

---

## 1. Tabela de Entitlements Comparativa

A tabela abaixo cruza os componentes premium desejados no novo perfil com os entitlements mapeados no `PlanFeatureCatalog`:

| Componente Premium | Entitlement Mapeado | Free | Essential | Pro | Enterprise |
|--------------------|---------------------|:---:|:---:|:---:|:---:|
| Selo Verificado | `verified_product` | ❌ |  |  |  |
| Badges de Destaque | `highlight_badges` | ❌ |  |  |  |
| CTAs Customizados | `custom_ctas` | ❌ |  |  |  |
| Bloco de Clientes | `ideal_customer_block` | ❌ |  |  |  |
| Mural de Prova Social | `social_proof` | ❌ |  |  |  |
| Banner Promocional | `promo_banner` | ❌ | ❌ |  |  |
| Tabela de Preços | `pricing_table` | ❌ | ❌ |  |  |
| Oferta Especial | `special_offer` | ❌ | ❌ |  |  |
| Materiais de Baixar | `downloadable_materials` | ❌ | ❌ |  |  |
| Galeria de Mídia | `media_gallery` / `media_upload` | ❌ | ❌ |  |  |
| Bloco de FAQ | `faq_block` | ❌ | ❌ |  |  |
| Analytics Avançado | `advanced_analytics` | ❌ | ❌ |  |  |
| Simulador Financeiro | `financing_simulation` | ❌ | ❌ |  |  |
| Marketplace de Leads | `leads_marketplace` | ❌ | ❌ | ❌ |  |
| Webhooks e IA | `webhooks` / `intent_scores` | ❌ | ❌ | ❌ |  |

---

## 2. Regras de Fallback Seguro

Para garantir resiliência e evitar quebras caso os dados de entitlements não cheguem ou o plano esteja ausente, o frontend Next.js adotará as seguintes regras de fallback canônicas:

- **Plano Ausente ou Erro na API:** Caso a chave `feature_access` venha vazia ou a chamada falhe, assume-se o plano **Free** como fallback de segurança absoluta.
- **Galeria de Mídia Bloqueada:** Se `media_gallery` for `false`, a aba Galeria é ocultada do cabeçalho de navegação e as fotos de capa do hero usam imagens institucionais ou placeholders premium da Avalia Solar.
- **FAQ Bloqueado:** Se `faq_block` for `false`, a aba FAQ é ocultada. Caso a empresa possua perguntas frequentes cadastradas no banco, o frontend apenas as renderizará se houver autorização explícita.
- **Simulador Financeiro Oculto:** O simulador de financiamento só será montado se `financing_simulation` e a visibilidade do bloco financeiro (`financing_tab_visible`) estiverem habilitadas.
- **Bloqueio de Concorrentes:** Se `show_competitor_banners` e `show_alternatives` forem falsos (padrão de planos Pro/Enterprise), os carrosséis de empresas alternativas e ads de competidores no sidebar e rodapé serão substituídos por propagandas corporativas da Avalia Solar ou espaços em branco elegantes.
