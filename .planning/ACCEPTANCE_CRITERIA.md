# ACCEPTANCE CRITERIA — Critérios Globais de Aceitação

A refatoração da página de perfil comercial só será considerada concluída para homologação e deploy em produção se atender plenamente a todos os critérios listados abaixo.

---

## 1. Critérios de Conformidade do Backend (Risco Zero)
- [ ] **Billing Stripe Intocado:** Nenhum model de faturamento ou webhook do Stripe foi alterado.
- [ ] **Active Admin Funcional:** Os planos e os blocos promocionais de banners das empresas continuam sendo gerenciados normalmente pelo Active Admin.
- [ ] **URLs Preservadas:** Nenhuma rota pública indexada no Google foi quebrada ou alterada.
- [ ] **Respeito a Entitlements:** As empresas dos planos **Free**, **Essential** e **Pro** exibem apenas os blocos aos quais têm direito de acordo com o `company.feature_access` canonizado da API:
  - Empresas **Free** não exibem selo verificado, galeria de mídia, FAQ ou simulador, e mostram concorrentes.
  - Empresas **Essential** exibem selo verificado, badges de destaque e CTAs customizados de orçamentos, mas mantêm galeria, FAQ e simulador ocultos.
  - Empresas **Pro** ou **Enterprise** ocultam anúncios de concorrentes e mostram todos os recursos liberados.

---

## 2. Critérios de Experiência do Usuário (UX/UI Premium)
- [ ] **Aparência Modernizada:** A página atende fielmente aos mockups visuais, utilizando cores HSL suaves, sombras delicadas ("Soft Elevation") e micro-animações ricas nas abas.
- [ ] **Sem placeholders:** Nenhuma imagem quebrada ou texto de simulação de placeholder é renderizado nas telas de captação.
- [ ] **Responsividade Homologada:** O perfil está 100% legível e utilizável nos tamanhos mobile (320px+), tablet e desktop, sem barras de rolagem horizontais indesejadas (overflow).

---

## 3. Critérios de SEO, Tracking e Telemetria
- [ ] **Semântica HTML5 Mantida:** Hierarquia estrita com uma única tag `<h1>` para o nome da empresa e marcação estruturada JSON-LD `Organization` injetada via SSR.
- [ ] **Tracking Operacional:** Disparo correto das chamadas de telemetria para os 22 eventos de telemetria definidos na especificação de tracking.
