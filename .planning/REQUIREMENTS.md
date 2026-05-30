# REQUIREMENTS — Refatoração Premium Leve do Perfil da Empresa

## 1. Requisitos Funcionais

### 1.1 Shell e Identidade Comum
- **Hero Premium**: Banner responsivo que suporta imagem de alta resolução fornecida pela empresa ou gradiente padrão.
- **Card de Identidade**: Logo, nome da empresa com badge de "Verificada" (se verificado_product = true), média de estrelas baseada em reviews, localização (cidade/estado) e CTAs de conversão.
- **Abas de Conteúdo**: Navegação suave sem recarregamento de página para as 6 seções.

### 1.2 Aba Visão Geral (Overview)
- **Sobre a Empresa**: Bloco textual de descrição curta ou detalhada.
- **Destaques Rápidos**: Grid dinâmico com métricas consolidadas (ex. Projetos realizados, Clientes atendidos).
- **Informações de Contato**: Telefone, e-mail, site oficial e endereço.
- **Claim Profile Card**: Caixa para empresas não reivindicadas chamando para o formulário de posse.
- **Empresas Relacionadas**: Carrossel horizontal de empresas similares na mesma categoria/região.
- **Banners Patrocinados**: Exibição do banner promocional da própria empresa ou anúncios institucionais do portal.

### 1.3 Aba Produtos e Serviços
- **Filtros Dinâmicos**: Filtragem instantânea no lado do cliente por tipo (Wallbox, Acessórios, Software, Serviços).
- **Ordenação**: Classificação por popularidade, data de cadastro e avaliações.
- **Layout Toggle**: Botão para alternar exibição entre Grid premium e Lista detalhada.
- **Especialista CTA**: Box convidando para tirar dúvidas caso não encontre um produto específico.

### 1.4 Aba Avaliações (Reviews) - Prioritária!
- **Score Card**: Nota média gigante, contador e estrelas interativas.
- **Distribuição de Notas**: Gráfico com barras horizontais mostrando o percentual de avaliações de 1 a 5 estrelas.
- **Filtros e Ordenação**: Filtro por pontuação de estrelas e ordenação ("Mais recentes", "Mais úteis").
- **Resposta da Empresa**: Exibição da resposta administrativa anexada a cada comentário de review.

### 1.5 Aba Projetos
- **Galeria de Projetos**: Portfólio de cases concluídos contendo fotos reais, especificações técnicas, localização e data do projeto.
- **Processo de Entrega**: Bloco informativo detalhando as etapas do processo (Diagnóstico, Instalação, Suporte).

### 1.6 Aba Estatísticas
- **Estatísticas Públicas**: Visualização de métricas autorizadas como total de pontos de recarga instalados.
- **Analytics Teaser**: Se a empresa for Free ou Essential, exibe um mockup dinâmico com efeito borrado das métricas avançadas (visitas, origens, leads) convidando ao upgrade para o plano Pro/Enterprise.

### 1.7 Aba Contato
- **Detalhes de Contato**: Endereço completo, link para rotas, e-mail público e telefone.
- **Formulário de Orçamento**: Ingestão de leads qualificados integrada ao painel B2B.
- **FAQ Block**: Módulo sanfonado com dúvidas frequentes.

---

## 2. Requisitos Não Funcionais
- **Responsividade Total**: Experiência excelente nos breakpoints Desktop (1280px+), Tablet (768px-1023px) e Mobile (320px-767px).
- **SEO & Semântica**: Estrutura clara usando tags HTML5 (`<header>`, `<main>`, `<aside>`, `<footer>`), uma única tag `<h1>` por página, tags meta otimizadas e marcação JSON-LD do tipo Schema.org `Organization`.
- **Desempenho**: Renderização veloz com skeletons elegantes de carregamento e carregamento preguiçoso (*lazy-loading*) dos componentes pesados (ex. gráficos, galerias).
