# COMPONENT SPEC — Especificação Técnica de Componentes

Este documento especifica a arquitetura e engenharia de cada componente Next.js a ser criado ou refatorado no portal **Avalia Solar**.

---

## 1. Componentes do Shell e Layout

### 1.1 `CompanyProfileLayout`
- **Responsabilidade:** Invólucro global (Shell) que assegura a integridade de todas as abas.
- **Estrutura Visual:**
  - Header Institucional da Avalia Solar.
  - Breadcrumb responsivo no topo.
  - `<CompanyPremiumHero>` (imagem de capa + logo + dados de reputação).
  - Menu de navegação das abas em formato sticky desktop.
  - Grid de conteúdo principal (`grid-cols-1 lg:grid-cols-12`):
    - Coluna da esquerda (8 colunas): Renderiza a aba ativa.
    - Coluna da direita (4 colunas): Renderiza a `<SidebarPremium>`.
  - Footer Institucional.

### 1.2 `CompanyPremiumHero`
- **Responsabilidade:** Bloco de impacto do cabeçalho.
- **Elementos:**
  - Capa: Imagem configurada pela empresa ou cor gradiente padrão. Se plano Pro/Enterprise, badge "Destaque Premium" é renderizado.
  - Card de Identidade flutuante no Desktop (e empilhado em Mobile):
    - Logo centralizado com borda branca e cantos arredondados.
    - Nome da empresa e badge de verificação verde com ícone de check.
    - Rating estelar com nota numérica (ex. 4.8) e atalho para ver avaliações.
    - Localização e atalhos rápidos.
    - Grupo de botões (CTAs): Solicitar Orçamento (abre quote wizard), WhatsApp e Comparar Empresa.

---

## 2. Componentes de Abas (Tabs)

### 2.1 `OverviewTab`
- **Responsabilidade:** Área comercial com resumo da empresa.
- **Elementos:**
  - Descrição da empresa com opção "Ver Mais" para textos extensos.
  - Highlights Grid: 4 cards rápidos mostrando conquistas (ex. Projetos entregues, pontos de carga, anos no mercado).
  - Carrossel de Empresas Relacionadas: Lista de empresas da mesma categoria na base, com filtro geográfico.
  - Preview rápido de 2 reviews recentes e 3 projetos.

### 2.2 `ProductsAndServicesTab`
- **Responsabilidade:** Exposição do portfólio de produtos e serviços.
- **Elementos:**
  - Filtro horizontal de categorias (Todos, Wallbox, Acessórios, Software, Serviços).
  - Barra de ordenação e alternador de layout (Grid / Lista).
  - Cards de produto contendo imagem, badge de relevância, nome, specs rápidas e botão "Ver detalhes".
  - CTA Especialista inferior: Se nada for encontrado, abre WhatsApp de vendas.

### 2.3 `ReviewsTab` (Aba Crítica)
- **Responsabilidade:** Mural de reputação com alta conversão.
- **Elementos:**
  - Nota média grande e estrelas interativas.
  - Barra horizontal de percentuais por estrela (1 a 5).
  - Resumo de critérios: Atendimento, Qualidade do produto, Suporte técnico, Custo-benefício, Cumprimento de prazos.
  - Lista de reviews verificados com avatar do avaliador, nota individual, depoimento textual, selo de verificado e botão "Útil".
  - Respostas da empresa aninhadas logo abaixo das reviews, integradas ao plano (somente planos com direito a resposta).

### 2.4 `ProjectsTab`
- **Responsabilidade:** Vitrine de obras e projetos efetuados.
- **Elementos:**
  - Cards de projetos realizados com imagem do local, segmento (Residencial, Comercial, Usina), tags de potência e componentes técnicos instalados.
  - Seção "Nosso Processo de Entrega": Linha do tempo horizontal detalhando os 5 passos do onboarding de instalação.

### 2.5 `StatisticsTab`
- **Responsabilidade:** Transparência de dados e gatilho de upsell.
- **Elementos:**
  - Seção pública: Volume de carregadores instalados, clientes atendidos.
  - Analytics Pro Preview (Teaser): Gráficos interativos (visitas, leads e taxa de conversão) com camada fosca e botão "Conhecer Planos Premium" para empresas sem plano Pro ativo.

### 2.6 `ContactTab`
- **Responsabilidade:** Canal direto de conversão.
- **Elementos:**
  - Cards de e-mail, telefones e site.
  - Mapa integrado (OpenStreetMap ou Google Maps).
  - FAQ sanfonada de perguntas rápidas.
