Precisamos melhorar a página /compare do Avalia Solar. O layout atual já tem uma tabela comparativa funcional, mas ainda está pobre em descoberta e decisão. Falta uma área de empresas recomendadas, sugestões inteligentes, resumo da comparação e melhor aproveitamento do espaço da página.

Objetivo:
Transformar /compare em uma página real de decisão, estilo G2, com comparação lado a lado, recomendações de empresas, ações de substituição, resumo inteligente e experiência mobile-first.

Problemas atuais:
1. Quando o usuário atinge 3 empresas selecionadas, o painel lateral apenas informa “limite atingido”.
2. Não aparecem empresas recomendadas para comparar.
3. A tabela tem poucos critérios e parece simples demais.
4. Falta resumo executivo da comparação.
5. A página fica com muito espaço vazio antes do footer.
6. O footer domina visualmente a página.
7. O usuário não tem próximos passos claros além de solicitar orçamento.
8. Falta lógica de substituição de empresas selecionadas.

TAREFA 1 — Melhorar painel lateral “Adicionar empresa”

Ajustar o componente lateral da página /compare.

Deve conter:
- título: “Adicionar empresa”
- descrição: “Busque e selecione até 3 empresas para comparar lado a lado.”
- contador: “3 de 3 selecionadas”
- input de busca
- estado quando limite atingido:
  “Você atingiu o limite de empresas.”
  “Remova uma empresa ou substitua por uma recomendada.”

Não esconder recomendações quando o limite estiver cheio.

TAREFA 2 — Criar seção “Empresas recomendadas”

Criar componente:

src/components/compare/RecommendedCompanies.tsx

Exibir abaixo do painel “Adicionar empresa”.

Título:
“Empresas recomendadas”

Subtítulo:
“Baseadas na sua cidade, categoria e empresas selecionadas.”

Cada card recomendado deve exibir:
- logo
- nome
- categoria
- cidade/UF
- nota média
- estrelas
- quantidade de avaliações
- selo verificada, se houver
- botão de ação

Se ainda houver espaço na comparação:
Botão:
“Adicionar”

Se o limite já foi atingido:
Botão:
“Substituir”

Ao clicar em “Substituir”, abrir popover/modal pequeno:
“Substituir qual empresa?”
Listar empresas selecionadas:
- Voltaia Brasil
- WEG
- CYMAZ

Ao selecionar uma, remover a empresa escolhida e adicionar a recomendada, atualizando a URL.

TAREFA 3 — Lógica de recomendação

Usar dados reais do backend já existente.

A recomendação deve priorizar:
1. empresas não selecionadas;
2. mesma categoria das empresas selecionadas;
3. mesma cidade ou região;
4. empresas verificadas;
5. maior rating;
6. maior número de avaliações;
7. empresas premium/patrocinadas, se houver, com label claro.

Não usar mock permanente.

Se não existir endpoint específico de recomendação, usar endpoint existente de empresas com query/filtros e criar adapter frontend temporário.

Possíveis fontes:
- lista de empresas já carregada;
- endpoint de empresas;
- endpoint de busca;
- categorias e cidades já disponíveis.

Criar função:

getRecommendedCompanies({
  selectedCompanies,
  allCompanies,
  city,
  category,
  limit
})

Ela deve excluir empresas já selecionadas e ordenar por score.

Score sugerido:
- +30 se mesma cidade
- +20 se mesma categoria
- +20 se verified
- +rating * 5
- +reviewsCount / 10 limitado a 20
- +10 se premium/destaque

TAREFA 4 — Adicionar resumo da comparação

Criar componente:

src/components/compare/CompareSummary.tsx

Exibir acima da tabela ou entre o hero e a tabela.

Título:
“Resumo da comparação”

Cards pequenos:
- Melhor nota
- Mais avaliações
- Melhor tempo de resposta
- Empresa verificada
- Melhor cobertura

Exemplo:
“Melhor nota: Voltaia Brasil”
“Mais experiência: Voltaia Brasil”
“Resposta mais rápida: WEG”
“Mais próxima de você: Voltaia Brasil”

Se dados estiverem ausentes, não mostrar card falso. Usar fallback:
“Dados insuficientes”

TAREFA 5 — Adicionar “Melhor match para você”

Criar componente opcional:

BestMatchCard

Exibir quando houver pelo menos 2 empresas.

Texto:
“Melhor match para sua comparação”

Exemplo:
“Voltaia Brasil parece ser a melhor opção para instalação solar em Florianópolis, considerando nota, verificação e cobertura.”

Botões:
- Ver perfil
- Solicitar orçamento

A lógica pode ser simples:
score = rating + verified + reviewsCount + sameCity + responseTime.

Não apresentar como verdade absoluta. Usar linguagem:
“parece ser”
“com base nos dados disponíveis”

TAREFA 6 — Enriquecer tabela comparativa

Adicionar mais grupos de critérios, desde que os dados existam ou tenham fallback seguro.

Seções recomendadas:

Avaliação geral:
- Nota geral
- Total de avaliações
- Recomendação
- Votos úteis

Confiança:
- Empresa verificada
- CNPJ verificado
- Documentos verificados
- Endereço verificado

Atendimento:
- Responde avaliações
- Tempo médio de resposta
- Orçamento gratuito
- Atendimento por WhatsApp

Atuação:
- Cidade base
- Cobertura
- Anos de experiência
- Projetos realizados

Comercial:
- Financiamento
- Formas de pagamento
- Garantia
- Suporte pós-venda

Especialidades:
- Energia solar residencial
- Energia solar comercial
- Mobilidade elétrica
- Wallbox/carregadores
- Bateria/armazenamento

Quando campo não existir:
- exibir “Consultar”
- ou “Não informado”
Nunca quebrar render.

TAREFA 7 — Melhorar CTA abaixo da tabela

Adicionar seção:

“Não encontrou o que procura?”

Texto:
“Explore empresas verificadas ou solicite a inclusão de uma empresa para comparar.”

Botões:
- Explorar mais empresas
- Sugerir empresa

Essa seção deve ficar antes do footer para reduzir sensação de vazio.

TAREFA 8 — Ajustar footer nesta página

O footer está muito dominante porque o conteúdo acima é pequeno.

Ajustar:
- reduzir margem superior se houver espaço excessivo;
- garantir que o conteúdo da página tenha densidade suficiente;
- manter footer full width;
- evitar grande área em branco entre comparação e footer.

TAREFA 9 — Mobile-first

No mobile:
- painel de adicionar empresa deve vir antes da tabela;
- empresas selecionadas devem aparecer como chips horizontais;
- recomendações devem virar cards empilhados;
- botão “Substituir” deve abrir bottom sheet;
- tabela deve virar accordion por seção ou tabela horizontal com scroll;
- resumo da comparação deve ser em cards 2 colunas ou scroll horizontal.

TAREFA 10 — URL state

Manter seleção sincronizada com URL.

Exemplo:
compare?companies=voltaia-brasil,weg,cymaz

Ao substituir empresa:
- atualizar query params;
- atualizar tabela;
- atualizar recomendações;
- não recarregar página inteira.

TAREFA 11 — Estados

Implementar:
- loading skeleton para recomendações;
- empty state se não houver recomendações;
- erro amigável se a busca falhar;
- toast ao adicionar/remover/substituir.

Mensagens:
- “Empresa adicionada à comparação.”
- “Empresa removida da comparação.”
- “Empresa substituída com sucesso.”
- “Você pode comparar até 3 empresas por vez.”

TAREFA 12 — Critérios de aceite

1. A página /compare deve exibir empresas recomendadas.
2. Se o limite estiver atingido, recomendações devem permitir substituição.
3. A tabela deve ter grupos de critérios mais ricos.
4. Deve existir resumo da comparação.
5. Deve existir CTA “Não encontrou o que procura?”
6. A página deve consumir dados reais do backend existente.
7. Nenhum campo ausente deve quebrar a página.
8. A seleção deve continuar sincronizada com a URL.
9. Mobile deve funcionar sem overflow horizontal no body.
10. Não quebrar header, footer, empresas, produtos ou dashboard.

Resultado esperado:
A página /compare deve parecer uma ferramenta premium de decisão, semelhante ao G2, mostrando comparação lado a lado, recomendações inteligentes, substituição de empresas, resumo rápido e CTAs claros para avançar para orçamento ou descoberta de mais empresas.
Precisamos implementar o banner hero da página /compare do Avalia Solar consumindo os banners já cadastrados no backend via Active Admin.

Contexto:
O Avalia Solar já possui arquitetura de banners/ads no Active Admin. A página /compare atualmente deve exibir um banner visual no topo ou lateral do hero, com tema de energia solar e mobilidade elétrica: casa com painéis solares, carro elétrico e carregador/wallbox.

Esse banner NÃO deve ser hardcoded no frontend.
Ele deve ser consumido do backend, usando a aba de banners do Active Admin.

Objetivo:
Criar/ajustar o slot de banner da página /compare para buscar e renderizar dinamicamente o banner cadastrado no Active Admin, permitindo que o admin troque imagem, link, status e posição sem deploy.

POSIÇÃO DO BANNER:
Criar ou usar uma posição específica:

compare_hero

Nome amigável:
Hero da Página de Comparação

Uso:
Banner principal da página /compare, exibido no topo da página ao lado do título ou acima da tabela de comparação.

TAMANHOS RECOMENDADOS:
Desktop:
- 1200x300
- 1600x400
- 4:1 ou 3.5:1
- Ideal para hero horizontal.

Tablet:
- 900x300

Mobile:
- 720x480 ou versão responsiva/crop vertical.

Se o modelo atual de banners já suporta formatos, usar:
- desktop_image
- tablet_image
- mobile_image

Caso não suporte, usar apenas image_url com object-fit cover e responsividade segura.

DESIGN DO BANNER:
O banner deve representar:
- casa moderna com painéis solares;
- carro elétrico;
- carregador/wallbox;
- visual limpo, premium e confiável;
- cores Avalia Solar: verde, azul escuro, amarelo solar e branco;
- espaço para texto, se o banner tiver copy embutida.

Copy sugerida para o banner:
“Compare empresas verificadas de energia solar e mobilidade elétrica”

Subcopy:
“Avaliações reais, orçamentos gratuitos e fornecedores confiáveis para carregadores, wallbox e infraestrutura EV.”

CTA visual:
“Fazer orçamento grátis”

Chips visuais:
- Carregadores
- Wallbox
- Frotas elétricas
- Empresas verificadas

IMPORTANTE:
Se o banner vier com texto embutido na imagem, não duplicar texto por cima no frontend.
Se o banner for apenas visual, o frontend pode manter texto do hero separado.

BACKEND / ACTIVE ADMIN:
Verificar se já existe model/tabela de banners.

Procurar por:
- Banner
- AdBanner
- MarketingBanner
- SponsoredBanner
- ActiveAdmin.register Banner
- app/admin/banners.rb
- app/models/banner.rb
- app/controllers/api/v1/banners_controller.rb

Se já existir:
- adicionar a posição compare_hero nas opções de position/placement.
- garantir que o Active Admin permita selecionar essa posição.
- garantir que o banner tenha campos:
  - title
  - subtitle opcional
  - image
  - mobile_image opcional
  - link_url
  - cta_label opcional
  - position
  - active
  - starts_at
  - ends_at
  - priority
  - sponsor_label opcional
  - alt_text

Se não existir API pública para banners:
Criar endpoint:

GET /api/v1/banners?position=compare_hero

Resposta esperada:
{
  "data": [
    {
      "id": 1,
      "title": "Compare empresas verificadas de mobilidade elétrica",
      "subtitle": "Avaliações reais, orçamentos gratuitos e fornecedores confiáveis.",
      "image_url": "...",
      "mobile_image_url": "...",
      "link_url": "/companies?category=mobilidade-eletrica",
      "cta_label": "Fazer orçamento grátis",
      "position": "compare_hero",
      "sponsor_label": "Patrocinado",
      "alt_text": "Casa com energia solar, carro elétrico e carregador wallbox",
      "active": true
    }
  ]
}

Regra:
- retornar apenas banners active=true;
- respeitar starts_at e ends_at, se existirem;
- ordenar por priority;
- se houver mais de um banner, retornar o de maior prioridade ou permitir rotação futura.

FRONTEND:
Na página /compare, criar componente:

src/components/banners/CompareHeroBanner.tsx

Responsabilidade:
- buscar banner position compare_hero;
- renderizar imagem responsiva;
- aplicar link se houver link_url;
- mostrar label “Patrocinado” se sponsor_label existir;
- usar alt_text;
- fallback visual se não houver banner ativo;
- não quebrar a página se a API falhar.

Também pode criar componente genérico:

src/components/banners/BannerSlot.tsx

Props:
- position
- className
- fallback
- aspectRatio
- priority

Exemplo de uso:

<BannerSlot
  position="compare_hero"
  aspectRatio="4/1"
  className="compare-hero-banner"
/>

LOCAL DE EXIBIÇÃO:
Na página /compare, exibir o banner no hero da página.

Layout desktop:
- conteúdo do hero à esquerda:
  - breadcrumb
  - badge “Comparador de empresas”
  - título “Compare antes de decidir.”
  - subtítulo
  - benefícios: Dados verificados, Avaliações reais, Comparação imparcial
- banner à direita ou como faixa horizontal superior, dependendo do layout atual.

Layout recomendado:
Se houver espaço:
grid-template-columns: 1fr 420px ou 1fr 480px

Se o banner for horizontal grande:
renderizar acima da tabela em container full width dentro do max-width.

Mobile:
- o banner deve aparecer abaixo do título;
- imagem responsiva;
- sem cortar texto importante;
- border-radius leve;
- se a imagem não funcionar bem no mobile, usar mobile_image_url.

ESTILO:
- card branco ou imagem em container limpo;
- border-radius 8px ou 10px;
- border 1px solid #E2E8F0;
- overflow hidden;
- sombra leve;
- não usar radius exagerado;
- manter estilo Swiss / G2-like;
- object-fit cover;
- background #F8FAFC enquanto carrega.

CSS/Tailwind sugerido:
relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm
aspect-[4/1]
md:aspect-[4/1]
max-md:aspect-[16/9]

Imagem:
w-full h-full object-cover

Label patrocinado:
absolute bottom-2 right-2
bg-slate-900/80 text-white text-[10px] rounded px-2 py-1

FALLBACK:
Se não houver banner ativo no backend, renderizar um fallback leve no frontend, sem imagem externa:

Título:
“Compare empresas verificadas”

Texto:
“Analise reputação, cobertura, avaliações e diferenciais antes de solicitar orçamento.”

Ícones:
- energia solar
- carro elétrico
- shield check

Mas esse fallback deve ser simples. O objetivo principal é usar o banner vindo do Active Admin.

NÃO FAZER:
- Não hardcodar imagem local diretamente na página /compare.
- Não colocar caminho fixo tipo /assets/compare/banner.png como única fonte.
- Não quebrar se a API retornar vazio.
- Não duplicar banners se já houver slot de ads global.
- Não criar novo sistema paralelo se o Active Admin já tem banners.
- Não usar imagem pesada sem otimização.
- Não comprometer Core Web Vitals.

SEO/ACESSIBILIDADE:
- usar alt_text vindo do backend;
- se não houver alt_text, fallback:
“Banner de comparação de empresas de energia solar e mobilidade elétrica”
- link do banner deve ter aria-label;
- não renderizar texto importante apenas dentro da imagem se for necessário para SEO.

EVENTOS / ANALYTICS:
Se já houver PostHog ou analytics:
Disparar eventos:
- banner_viewed
- banner_clicked

Properties:
- banner_id
- position: compare_hero
- page: compare
- link_url
- sponsor_label

CRITÉRIOS DE ACEITE:
1. A página /compare consome banner do Active Admin pela position compare_hero.
2. O banner não fica hardcoded no frontend.
3. O admin consegue trocar a imagem sem deploy.
4. A página não quebra se não houver banner ativo.
5. O banner funciona em desktop, tablet e mobile.
6. O banner usa alt_text corretamente.
7. O layout mantém estilo premium, G2-like e bordas mais retas.
8. A imagem não causa overflow horizontal.
9. Cliques no banner respeitam link_url.
10. Se houver analytics, view e click são registrados.

RESULTADO ESPERADO:
A página /compare deve exibir um banner premium e dinâmico, controlado pelo Active Admin, com temática de casa solar, carro elétrico e carregador/wallbox, reforçando o posicionamento do Avalia Solar como plataforma de comparação confiável para energia solar e mobilidade elétrica.