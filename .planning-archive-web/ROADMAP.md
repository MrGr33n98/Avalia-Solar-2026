ADENDO OBRIGATÓRIO — BANNERS, ÍCONES, IMAGENS E ASSETS REAIS

Além de remover os dados mockados de empresas, produtos, reviews, categorias, blog, planos e leads, também é obrigatório remover todos os banners, ícones, imagens, logos, ilustrações e assets mockados ou hardcoded do app Android.

O app mobile deve consumir e reutilizar os mesmos dados visuais reais já existentes no web app Avalia Solar e/ou no backend Rails/Active Admin.

====================================================================
1. REMOVER BANNERS MOCKADOS
====================================================================

Procurar e remover qualquer banner fixo, fake ou hardcoded usado no app.

Buscar por padrões como:
- mockBanners
- bannersMock
- fakeBanners
- demoBanners
- sampleBanners
- hardcoded banners
- banner placeholder
- imagens locais usadas como banner real
- arrays fixos de banners
- banners definidos diretamente em componentes

Regras:
- Nenhum banner exibido ao usuário pode ser fake.
- Banners devem vir do backend/Active Admin.
- Respeitar posição, página, status ativo/inativo, datas de início/fim, plano, segmentação e prioridade, se esses campos existirem.
- Se não houver banner ativo para determinada tela, o app deve esconder o espaço ou exibir um estado neutro, sem quebrar layout.
- Não usar banner genérico inventado para preencher tela.

Locais onde os banners reais devem aparecer:
- Home.
- Categorias.
- Empresas.
- Detalhe da empresa.
- Produtos.
- Detalhe do produto.
- Blog.
- Cidades.
- Estados.
- Busca.
- Chat/MobiVolt AI, se existir posição comercial.
- Comparação, se existir posição comercial.

Tipos de banner a considerar:
- Banner hero.
- Banner horizontal.
- Banner carrossel.
- Banner quadrado.
- Banner patrocinado.
- Banner sidebar/ad slot.
- Banner regional.
- Banner por categoria.
- Banner por cidade/estado.
- Banner de empresa patrocinada.
- Banner de produto patrocinado.

====================================================================
2. ÍCONES REAIS E PADRONIZADOS
====================================================================

Remover ícones temporários, genéricos, inconsistentes ou hardcoded quando eles estiverem representando categorias, serviços, produtos ou funcionalidades que já possuem padrão visual no web app.

Buscar por:
- mockIcons
- categoryIcons hardcoded
- fake icons
- emoji icons
- ícones aleatórios por categoria
- imagens locais provisórias
- placeholders
- URLs fixas dentro dos componentes

Regras:
- Ícones de categorias devem vir do backend, se já houver campo de imagem/ícone.
- Se o web app já possui ícones oficiais, reutilizar o mesmo padrão no app.
- Se o backend ainda não entregar ícones, criar contrato mínimo para retornar:
  - icon_url
  - icon_name
  - icon_alt
  - active
  - category_id
- Não usar emoji como ícone final.
- Não misturar estilos diferentes de ícones.
- Todos os ícones devem seguir o padrão visual da Avalia Solar.
- Ícones devem funcionar em tema claro e escuro, se o app suportar.
- Ícones devem ter tamanho consistente.

Tamanhos sugeridos:
- Ícones de categorias na Home: 40x40.
- Ícones de chips/filtros: 20x20 ou 24x24.
- Ícones de cards: 28x28 ou 32x32.
- Ícones de navegação inferior: 22x22 a 26x26.
- Ícones de serviços: 36x36.
- Ícones de empresas/produtos: usar logo ou imagem real, não ícone genérico.

====================================================================
3. LOGOS REAIS DAS EMPRESAS
====================================================================

Todos os logos de empresas devem vir do backend.

Regras:
- Não usar logo fake.
- Não usar iniciais fixas como substituto principal quando houver logo real.
- Se empresa não tiver logo, usar fallback visual neutro e padronizado.
- O fallback deve mostrar inicial/nome da empresa de forma limpa, mas não pode parecer empresa fictícia.
- Respeitar imagem enviada no cadastro/admin.
- Usar cache e lazy loading.
- Tratar erro de imagem quebrada.

Campos esperados:
- logo_url
- name
- verified
- sponsored
- rating
- city
- state

====================================================================
4. IMAGENS REAIS DE PRODUTOS
====================================================================

Todos os produtos devem usar imagens reais vindas da API/backend.

Regras:
- Remover imagens locais falsas de inversores, placas, baterias etc.
- Não usar produto genérico se o produto possui imagem cadastrada.
- Se produto não tiver imagem, usar fallback neutro “imagem indisponível”.
- Não exibir imagem de outro produto como se fosse real.
- Não usar preço, marca ou imagem fictícia.

Campos esperados:
- image_url
- gallery_urls
- brand
- supplier
- name
- category
- price
- technical_specs

====================================================================
5. IMAGENS REAIS DO BLOG
====================================================================

Posts do blog devem usar imagem real do backend/CMS/admin.

Regras:
- Remover imagens fake de posts.
- Não usar thumbnail genérica hardcoded.
- Se não houver imagem, usar card textual com fallback elegante.
- Manter título, resumo, autor, data e categoria reais.

Campos esperados:
- title
- slug
- cover_image_url
- excerpt
- author
- published_at
- category

====================================================================
6. ASSETS DO MOBIVOLT AI
====================================================================

O chat/MobiVolt AI não pode usar avatar ou ilustrações temporárias.

Regras:
- Usar o avatar oficial do MobiVolt AI, se já existir no projeto.
- Se o avatar estiver no web app, reutilizar no mobile.
- Se o backend/admin entregar assets do assistente, consumir da API.
- Não usar robô genérico de biblioteca como versão final.
- Não usar avatar diferente do padrão da marca.
- Cards de empresas recomendadas pelo chat devem usar logos reais, notas reais e dados reais.

====================================================================
7. CATEGORIAS VISUAIS
====================================================================

As categorias do app devem usar:
- Nome real.
- Slug real.
- Ícone real.
- Imagem real, se existir.
- Ordem real definida no admin.
- Status ativo/inativo real.
- Vertical real: Energia Solar ou Mobilidade Elétrica.

Não hardcodar categorias como:
- Energia Solar
- Mobilidade Elétrica
- Inversores
- Baterias
- Carregadores
- Off-grid

Essas categorias só podem aparecer se vierem do backend ou se forem uma constante oficial compartilhada/documentada do projeto.

====================================================================
8. BANNERS E ÍCONES VINDOS DO ACTIVE ADMIN
====================================================================

Verificar no backend Rails/Active Admin quais modelos já existem para:
- banners
- ads
- categories
- companies
- products
- blog posts
- uploaded images
- active storage
- attachments
- icons
- logos

O app mobile deve consumir esses dados reais por API.

Se algum endpoint não existir, criar ou propor endpoint mínimo, por exemplo:

GET /api/v1/mobile/home
GET /api/v1/banners?placement=home
GET /api/v1/banners?placement=category&category_id=:id
GET /api/v1/categories
GET /api/v1/categories/:id
GET /api/v1/companies
GET /api/v1/companies/:id
GET /api/v1/products
GET /api/v1/products/:id
GET /api/v1/blog/posts
GET /api/v1/mobile/assets

Não duplicar uploads no app.
Não copiar manualmente imagens do web para pasta local do mobile.
A fonte da verdade deve ser o backend/admin.

====================================================================
9. PADRÃO DE FALLBACK VISUAL
====================================================================

Criar fallback visual elegante para quando não existir imagem real.

Fallbacks permitidos:
- Empresa sem logo: card com inicial da empresa e fundo neutro.
- Produto sem imagem: bloco “Imagem indisponível”.
- Banner ausente: ocultar slot.
- Categoria sem ícone: ícone neutro padronizado da biblioteca oficial, não emoji.
- Blog sem imagem: card textual com fundo suave.

Fallbacks proibidos:
- Empresa fake.
- Produto fake.
- Banner fake.
- Imagem baixada aleatoriamente.
- Placeholder com lorem ipsum em produção.
- Imagem de outra marca/produto.
- Ícone emoji em tela final.

====================================================================
10. AUDITORIA DE ASSETS
====================================================================

Antes de implementar, gerar uma auditoria com:

- Lista de todos os banners mockados encontrados.
- Lista de todos os ícones hardcoded.
- Lista de imagens locais usadas como dado real.
- Lista de logos fake.
- Lista de thumbnails fake.
- Lista de produtos com imagens mockadas.
- Lista de categorias com ícones mockados.
- Lista de telas afetadas.

Depois da implementação, entregar:

- Quais mocks foram removidos.
- Quais banners agora vêm da API.
- Quais ícones agora vêm da API.
- Quais imagens/logos agora vêm da API.
- Quais fallbacks foram criados.
- Quais endpoints foram usados.
- Quais endpoints ainda precisam ser criados no backend.

====================================================================
11. REGRA FINAL
====================================================================

O app Android não pode parecer uma versão demonstrativa.

Ele precisa usar:
- dados reais;
- banners reais;
- logos reais;
- ícones reais;
- imagens reais;
- categorias reais;
- posts reais;
- produtos reais;
- empresas reais;
- reviews reais;
- regras reais do web app.

Tudo que for mock, fake, placeholder ou hardcoded deve ser removido das telas finais ou isolado apenas para testes/storybook/fixtures.

O objetivo é transformar o app Android no aplicativo oficial do Avalia Solar, consumindo a mesma base real do web app.

sequenceDiagram
    participant U as Usuário
    participant APP as App Android
    participant API as API Rails
    participant DB as PostgreSQL
    participant ADMIN as Active Admin
    participant AUTH as Auth/JWT
    participant STORAGE as Storage/Imagens
    participant ADS as Banners/Ads
    participant AI as MobiVolt AI
    participant MAPS as Maps/Localização
    participant PH as PostHog
    participant EXT as WhatsApp/E-mail

    rect rgb(255, 250, 210)
    Note over U,APP: Primeiro acesso / Home
    U->>APP: Abrir app
    APP->>API: GET /api/v1/mobile/home
    API->>DB: Buscar categorias, empresas, produtos, posts
    API->>ADMIN: Buscar configurações e destaques
    API->>ADS: Buscar banners ativos por posição
    API->>STORAGE: Resolver URLs de imagens, logos e ícones
    API-->>APP: Retornar dados reais da Home
    APP-->>U: Exibir Home premium
    APP->>PH: Evento app_opened / home_loaded
    end

    rect rgb(255, 250, 210)
    Note over U,APP: Busca e filtros
    U->>APP: Buscar empresa/produto/categoria
    APP->>API: GET /api/v1/search?q=termo&filters
    API->>DB: Buscar resultados reais
    API-->>APP: Retornar empresas, produtos e categorias
    APP-->>U: Exibir resultados com filtros
    APP->>PH: Evento search_performed
    end

    rect rgb(255, 250, 210)
    Note over U,APP: Categorias
    U->>APP: Abrir categoria
    APP->>API: GET /api/v1/categories/:slug
    API->>DB: Buscar categoria, empresas e produtos relacionados
    API->>ADS: Buscar banners da categoria
    API->>STORAGE: Buscar ícone/imagem da categoria
    API-->>APP: Retornar categoria real
    APP-->>U: Exibir tela da categoria
    end

    rect rgb(255, 250, 210)
    Note over U,APP: Empresas
    U->>APP: Abrir lista de empresas
    APP->>API: GET /api/v1/companies
    API->>DB: Buscar empresas reais
    API->>STORAGE: Resolver logos reais
    API-->>APP: Retornar lista paginada
    APP-->>U: Exibir cards de empresas

    U->>APP: Abrir perfil da empresa
    APP->>API: GET /api/v1/companies/:slug
    API->>DB: Buscar detalhes, reviews, serviços e cobertura
    API->>ADS: Buscar banners relacionados
    API->>STORAGE: Buscar logo e galeria
    API-->>APP: Retornar perfil completo
    APP-->>U: Exibir detalhe da empresa
    APP->>PH: Evento company_viewed
    end

    rect rgb(255, 250, 210)
    Note over U,APP: Login gate para contatos
    U->>APP: Clicar em telefone/WhatsApp
    APP->>AUTH: Verificar sessão
    alt Usuário logado
        APP->>API: GET /api/v1/companies/:id/contact
        API-->>APP: Retornar contato autorizado
        APP-->>U: Exibir contato
        APP->>PH: Evento phone_revealed / whatsapp_clicked
    else Usuário não logado
        APP-->>U: Abrir modal de login/cadastro
        U->>APP: Informar credenciais
        APP->>API: POST /api/v1/auth/login
        API->>AUTH: Validar e gerar token
        AUTH-->>APP: Retornar sessão
        APP->>API: Solicitar contato novamente
        API-->>APP: Retornar contato autorizado
        APP-->>U: Exibir contato
    end
    end

    rect rgb(255, 250, 210)
    Note over U,APP: Produtos
    U->>APP: Abrir produtos
    APP->>API: GET /api/v1/products
    API->>DB: Buscar produtos reais
    API->>STORAGE: Resolver imagens reais
    API-->>APP: Retornar produtos
    APP-->>U: Exibir lista de produtos

    U->>APP: Abrir detalhe do produto
    APP->>API: GET /api/v1/products/:slug
    API->>DB: Buscar detalhes e especificações
    API->>STORAGE: Buscar imagem e galeria
    API-->>APP: Retornar produto completo
    APP-->>U: Exibir detalhe do produto
    APP->>PH: Evento product_viewed
    end

    rect rgb(255, 250, 210)
    Note over U,APP: Lead / Orçamento
    U->>APP: Solicitar orçamento
    APP-->>U: Abrir formulário
    U->>APP: Preencher dados + LGPD
    APP->>API: POST /api/v1/leads
    API->>DB: Criar lead real
    API->>ADMIN: Disponibilizar lead no painel
    API->>EXT: Notificar por WhatsApp/E-mail se configurado
    API-->>APP: Retornar sucesso
    APP-->>U: Exibir confirmação
    APP->>PH: Evento lead_submitted
    end

    rect rgb(255, 250, 210)
    Note over U,APP: MobiVolt AI
    U->>APP: Abrir chat
    APP->>API: POST /api/v1/chat/sessions
    API->>DB: Criar sessão
    API-->>APP: Retornar session_id

    U->>APP: Enviar mensagem
    APP->>API: POST /api/v1/chat/messages
    API->>AI: Processar com contexto real
    AI-->>API: Retornar resposta
    API->>DB: Salvar mensagens e insights
    API-->>APP: Retornar resposta + empresas recomendadas
    APP-->>U: Exibir resposta e cards reais
    APP->>PH: Evento chat_opened / chat_lead_created
    end

    rect rgb(255, 250, 210)
    Note over U,APP: Comparação
    U->>APP: Adicionar à comparação
    APP->>API: GET /api/v1/compare?ids[]
    API->>DB: Buscar dados comparativos reais
    API-->>APP: Retornar comparação
    APP-->>U: Exibir comparação mobile
    APP->>PH: Evento compare_added
    end

    rect rgb(255, 250, 210)
    Note over U,APP: Localização / Mapa / Raio
    U->>APP: Buscar empresas próximas
    APP-->>U: Solicitar permissão de localização
    alt Permissão concedida
        APP->>MAPS: Capturar localização aproximada
        APP->>API: GET /api/v1/companies/nearby
        API->>DB: Buscar empresas por raio
        API-->>APP: Retornar empresas próximas
        APP-->>U: Exibir mapa/lista
    else Permissão negada
        APP-->>U: Exibir busca manual por cidade/estado
    end
    end

    rect rgb(255, 250, 210)
    Note over U,APP: Blog
    U->>APP: Abrir blog
    APP->>API: GET /api/v1/blog/posts
    API->>DB: Buscar posts publicados
    API->>STORAGE: Resolver imagens reais
    API-->>APP: Retornar posts
    APP-->>U: Exibir blog
    end

    rect rgb(255, 250, 210)
    Note over U,APP: Perfil e favoritos
    U->>APP: Abrir perfil
    APP->>AUTH: Verificar sessão
    APP->>API: GET /api/v1/me
    API->>DB: Buscar usuário, favoritos e orçamentos
    API-->>APP: Retornar dados do usuário
    APP-->>U: Exibir perfil
    end

    Diagrama de fluxo — Avalia Solar Android App
Atores / Sistemas no topo do diagrama
Usuário
App Android
API Rails
Banco PostgreSQL
Active Admin
Auth/JWT
Banners/Ads
Storage/Imagens
PostHog
MobiVolt AI
WhatsApp/E-mail
Google Maps/Localização
1. Primeiro acesso ao app
Usuário → App Android
Abre o aplicativo

App Android → API Rails
Buscar configurações iniciais do app

API Rails → Banco PostgreSQL
Carregar categorias, empresas destaque, produtos, banners, posts e flags

API Rails → App Android
Retornar dados reais

App Android → Usuário
Exibir Home real
Telas envolvidas
Splash Screen
Onboarding rápido
Home
Permissão de localização
Login opcional
Regras
Não carregar dados mockados
Não exibir banner fake
Não exibir categorias hardcoded
Não pedir localização sem explicar finalidade
2. Home do app
Usuário → App Android
Acessa Home

App Android → API Rails
GET /api/v1/mobile/home

API Rails → Banco PostgreSQL
Buscar:
- categorias ativas
- empresas destaque
- empresas verificadas
- produtos destaque
- banners ativos
- posts recentes
- cidades principais

API Rails → App Android
Retornar Home real

App Android → Usuário
Renderizar Home premium
Componentes da Home
Header com logo Avalia Solar
Busca principal
Categorias rápidas
Banner hero real
Empresas em destaque
Produtos em destaque
Empresas verificadas
Posts do blog
CTA Solicitar orçamento
CTA MobiVolt AI
Bottom navigation
Estado alternativo
Se não houver banner:
Ocultar slot

Se não houver produtos:
Mostrar "Nenhum produto em destaque no momento"

Se API falhar:
Mostrar erro + botão tentar novamente
3. Busca geral
Usuário → App Android
Digita termo na busca

App Android → API Rails
GET /api/v1/search?q=termo

API Rails → Banco PostgreSQL
Buscar empresas, produtos, categorias e posts relacionados

API Rails → App Android
Retornar resultados reais

App Android → Usuário
Exibir tela de resultados
Tela
Buscar
Resultados
Filtros
Ordenação
Filtros principais
Categoria
Cidade
Estado
Avaliação
Empresa verificada
Empresa patrocinada
Produto
Faixa de preço
Aplicação
Raio/localização
4. Fluxo de categorias
Usuário → App Android
Clica em uma categoria

App Android → API Rails
GET /api/v1/categories/:slug

API Rails → Banco PostgreSQL
Buscar categoria, empresas relacionadas, produtos, banners e conteúdo

API Rails → App Android
Retornar dados reais da categoria

App Android → Usuário
Exibir página da categoria
Tela de categoria
Categoria Solar
Categoria Mobilidade Elétrica
Subcategorias
Empresas relacionadas
Produtos relacionados
Banners da categoria
Guias de compra
CTA Solicitar orçamento
Regras
Categoria deve vir do backend
Ícone da categoria deve vir da API
Imagem da categoria deve vir da API
Ordem deve respeitar Active Admin
Status ativo/inativo deve ser respeitado
5. Fluxo de empresas
Usuário → App Android
Acessa lista de empresas

App Android → API Rails
GET /api/v1/companies

API Rails → Banco PostgreSQL
Buscar empresas reais com filtros

API Rails → App Android
Retornar lista paginada

App Android → Usuário
Exibir cards de empresas
Tela lista de empresas
Busca
Filtros
Mapa/lista
Empresas patrocinadas
Empresas verificadas
Empresas próximas
Cards de empresas
Paginação/infinite scroll
Card de empresa
Logo real
Nome
Cidade/Estado
Nota média
Total de avaliações
Selo verificado
Badge patrocinado
Categorias atendidas
Botão Ver perfil
Botão Solicitar orçamento
Botão Comparar
6. Detalhe da empresa
Usuário → App Android
Clica em Ver perfil

App Android → API Rails
GET /api/v1/companies/:slug

API Rails → Banco PostgreSQL
Buscar dados completos da empresa

API Rails → Storage/Imagens
Buscar logo, galeria e imagens reais

API Rails → App Android
Retornar perfil completo

App Android → Usuário
Exibir página da empresa
Tela detalhe da empresa
Hero da empresa
Logo real
Nome
Selo verificado
Badge patrocinado
Nota média
Cidade/estado
Sobre a empresa
Serviços
Categorias
Área de cobertura
Produtos vinculados
Reviews
Banners relacionados
Empresas semelhantes
Botões de contato
Ações
Solicitar orçamento
Ver telefone
Falar no WhatsApp
Acessar site
Favoritar
Comparar
Avaliar empresa
7. Login gate para contatos
Usuário → App Android
Clica em Ver telefone ou WhatsApp

App Android → Auth/JWT
Verificar se usuário está logado

alt Usuário logado
    App Android → API Rails
    Solicitar contato da empresa

    API Rails → App Android
    Retornar contato autorizado

    App Android → Usuário
    Exibir telefone/WhatsApp

else Usuário não logado
    App Android → Usuário
    Abrir modal de login/cadastro

    Usuário → App Android
    Faz login ou cadastro

    App Android → API Rails
    Autenticar usuário

    API Rails → Auth/JWT
    Gerar sessão/token

    Auth/JWT → App Android
    Retornar sessão válida

    App Android → API Rails
    Solicitar contato novamente

    API Rails → App Android
    Retornar contato autorizado
end
Regra
O app deve respeitar exatamente a mesma regra do web app.
Visitante não logado não acessa contato completo se o web bloqueia.
8. Fluxo de produtos
Usuário → App Android
Acessa Produtos

App Android → API Rails
GET /api/v1/products

API Rails → Banco PostgreSQL
Buscar produtos reais

API Rails → App Android
Retornar produtos paginados

App Android → Usuário
Exibir lista de produtos
Tela lista de produtos
Busca por produto, marca ou modelo
Chips de categorias
Filtros principais
Filtros técnicos avançados recolhidos
Cards de produtos
Produtos relacionados
Empresas que vendem esse produto
Guias de compra
Card de produto
Imagem real
Marca
Nome
Categoria
Aplicação
Preço ou "Consultar preço"
Avaliação
Badge destaque/premium
Botão Ver detalhes
Botão Solicitar orçamento
9. Detalhe do produto
Usuário → App Android
Clica em produto

App Android → API Rails
GET /api/v1/products/:slug

API Rails → Banco PostgreSQL
Buscar produto, fornecedor, specs e produtos relacionados

API Rails → Storage/Imagens
Buscar imagem e galeria real

API Rails → App Android
Retornar produto completo

App Android → Usuário
Exibir detalhe do produto
Tela detalhe do produto
Imagem principal
Galeria
Marca/fornecedor
Nome
Preço ou consultar preço
Descrição
Especificações técnicas
Aplicações
Garantia
Certificações
Produtos relacionados
Empresas que trabalham com esse produto
CTA Solicitar orçamento
10. Fluxo de orçamento / lead
Usuário → App Android
Clica em Solicitar orçamento

App Android → Usuário
Abrir formulário de orçamento

Usuário → App Android
Preenche nome, WhatsApp, e-mail, cidade, estado, tipo de projeto e consentimento LGPD

App Android → API Rails
POST /api/v1/leads

API Rails → Banco PostgreSQL
Criar lead real

API Rails → Active Admin
Disponibilizar lead no painel

API Rails → WhatsApp/E-mail
Disparar notificação se configurado

API Rails → App Android
Retornar sucesso

App Android → Usuário
Exibir confirmação
Campos
Nome
WhatsApp
E-mail
Cidade
Estado
Categoria de interesse
Produto de interesse
Empresa de interesse
Tipo de projeto
Mensagem
Consentimento LGPD
Origem: Android App
11. MobiVolt AI / Chat
Usuário → App Android
Abre MobiVolt AI

App Android → API Rails
POST /api/v1/chat/sessions

API Rails → Banco PostgreSQL
Criar sessão real

API Rails → App Android
Retornar session_id

Usuário → App Android
Envia mensagem

App Android → API Rails
POST /api/v1/chat/messages

API Rails → MobiVolt AI
Processar pergunta

MobiVolt AI → API Rails
Gerar resposta com contexto real

API Rails → Banco PostgreSQL
Salvar mensagem e insights

API Rails → App Android
Retornar resposta e recomendações

App Android → Usuário
Exibir resposta + cards de empresas reais
Tela chat
Avatar oficial MobiVolt AI
Histórico de mensagens
Campo de texto
Cards de empresas recomendadas
Botão Ver perfil
Botão Solicitar orçamento
Botão WhatsApp
Botão Comparar
Formulário de lead no chat
Regra crítica
O app Android nunca chama API de IA diretamente.
Toda IA passa pelo backend.
12. Fluxo de comparação
Usuário → App Android
Adiciona empresa/produto à comparação

App Android → Local State / API Rails
Salvar item na comparação

Usuário → App Android
Abre tela Comparar

App Android → API Rails
GET /api/v1/compare?ids[]=...

API Rails → Banco PostgreSQL
Buscar dados reais dos itens

API Rails → App Android
Retornar comparação

App Android → Usuário
Exibir tabela comparativa mobile
Tela comparação
Itens comparados
Notas
Categorias
Serviços
Produtos
Tecnologias
Certificações
Formas de pagamento
Cidade/estado
Diferenciais
CTA Solicitar orçamento
13. Fluxo de favoritos
Usuário → App Android
Clica em Favoritar

App Android → Auth/JWT
Verifica login

alt Usuário logado
    App Android → API Rails
    POST /api/v1/favorites

    API Rails → Banco PostgreSQL
    Salvar favorito

    API Rails → App Android
    Retornar sucesso

    App Android → Usuário
    Atualizar ícone de favorito

else Usuário não logado
    App Android → Usuário
    Abrir login gate
end
Tela favoritos
Empresas favoritas
Produtos favoritos
Remover favorito
Acessar perfil
Solicitar orçamento