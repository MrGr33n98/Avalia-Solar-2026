# MCP MVP — Avalia Solar

O gateway interno expõe dez tools sobre dados reais do Rails/PostgreSQL em:

`POST /api/v1/mcp/tools/:tool_name`

O corpo aceita `arguments` (ou `input`) como objeto JSON. Tools privadas usam o mesmo JWT da API no header `Authorization: Bearer <token>`.

## Tools e acesso

| Tool | Acesso |
| --- | --- |
| `search_companies` | Público |
| `search_products` | Público |
| `get_company_profile` | Público, somente empresas ativas |
| `compare_companies` | Público, 2–3 empresas ativas |
| `get_reviews_summary` | Público, somente avaliações aprovadas |
| `create_review_request` | Membro ativo da própria empresa ou admin |
| `get_company_dashboard_metrics` | Membro ativo da própria empresa ou admin |
| `get_leads_summary` | Membro ativo da própria empresa ou admin |
| `recommend_next_actions` | Membro ativo da própria empresa ou admin |
| `get_market_snapshot` | Admin |

## Perguntas e insights que o MVP consegue responder

As perguntas abaixo são exemplos de linguagem natural que o MobiVolt AI pode converter em chamadas às tools. As respostas devem sempre refletir os registros existentes; ausência de dados deve ser apresentada como “não informado”, “dados insuficientes” ou lista vazia.

### Descoberta de empresas — `search_companies`

Parâmetros disponíveis: `query`, `city`, `state`, `category`, `verified` e `limit`.

Perguntas que conseguimos responder:

- Quais empresas de energia solar estão cadastradas?
- Quais empresas trabalham com energia solar residencial?
- Quais empresas oferecem instalação de painéis solares?
- Quais empresas trabalham com baterias ou armazenamento de energia?
- Quais empresas trabalham com wallbox ou mobilidade elétrica?
- Quais instaladores atendem em Florianópolis?
- Quais empresas estão cadastradas em São Paulo?
- Existem empresas verificadas em Curitiba?
- Encontre empresas da categoria “Inversores solares”.
- Encontre uma empresa chamada Voltaia.
- Existem empresas cujo nome contém “Solar”?
- Quais empresas oferecem determinado serviço?
- Quais são as empresas mais bem avaliadas entre os resultados encontrados?
- Quais resultados possuem mais avaliações?
- Qual é o perfil público, cidade, estado, nota e número de avaliações das empresas encontradas?
- Quais empresas encontradas são verificadas?
- Quais categorias e serviços estão associados a cada empresa?

Insights possíveis:

- Lista ordenada priorizando verificação, nota e quantidade de avaliações.
- Disponibilidade de empresas por cidade, estado, categoria ou serviço.
- Identificação de buscas sem oferta cadastrada.
- Shortlist inicial para comparação, sem afirmar que uma empresa é objetivamente “a melhor”.

### Descoberta de produtos — `search_products`

Parâmetros disponíveis: `query` e `limit`.

Perguntas que conseguimos responder:

- Quais produtos WEG estão cadastrados?
- Existem inversores solares cadastrados?
- Quais produtos correspondem à busca “bateria”?
- Quais equipamentos de mobilidade elétrica estão disponíveis?
- Quais produtos pertencem a determinada marca?
- Quais produtos pertencem a determinada categoria?
- Qual é o preço cadastrado de um produto?
- Qual empresa cadastrou ou comercializa o produto?
- Qual é a descrição, marca, categoria e imagem do produto?
- Existe produto relacionado ao termo pesquisado mesmo quando não existe empresa com esse nome?

Insights possíveis:

- Relação entre produto, marca, categorias e empresa responsável.
- Faixa de opções encontradas para uma necessidade descrita pelo usuário.
- Ausência de produtos cadastrados para uma marca ou categoria.

### Perfil público da empresa — `get_company_profile`

Parâmetros disponíveis: `company_id` ou `slug`.

Perguntas que conseguimos responder:

- Quem é a empresa Voltaia Brasil?
- Qual é a descrição pública da empresa?
- Onde a empresa está localizada?
- A empresa é verificada?
- Qual é a nota média da empresa?
- Quantas avaliações a empresa possui?
- Quais categorias estão vinculadas à empresa?
- Quais serviços a empresa informa oferecer?
- Quais cidades e estados a empresa informa atender?
- Qual é o site público da empresa?
- Qual é o link do perfil completo da empresa?
- A empresa possui logo cadastrado?

Insights possíveis:

- Resumo público seguro para cards, chat e recomendação.
- Cobertura declarada pela empresa.
- Presença ou ausência de sinais públicos de reputação.

### Comparação de empresas — `compare_companies`

Parâmetro disponível: `company_ids`, contendo de duas a três IDs ou slugs.

Perguntas que conseguimos responder:

- Compare Voltaia, WEG e outra empresa cadastrada.
- Qual das empresas possui maior nota média?
- Qual das empresas possui mais avaliações?
- Quais empresas comparadas são verificadas?
- Em quais cidades e estados cada empresa atua?
- Quais categorias e serviços cada empresa informa oferecer?
- Quais tipos de projeto cada empresa atende?
- Alguma empresa informa opção de financiamento?
- Qual é o tempo de resposta informado por cada empresa?
- Qual empresa foi fundada há mais tempo, quando esse dado estiver disponível?
- Quais diferenças objetivas existem entre as empresas selecionadas?
- Quais informações estão ausentes em cada perfil?

Insights possíveis:

- Comparação lado a lado baseada nos mesmos campos públicos.
- Destaque de diferenças de reputação, cobertura, serviços e informações comerciais.
- Identificação de dados insuficientes sem transformar ausência em resposta positiva.

Limite: a tool não declara vencedora absoluta e não infere qualidade, documentação, certificação, cobertura ou serviço que não estejam cadastrados.

### Resumo de avaliações — `get_reviews_summary`

Parâmetros disponíveis: `company_id` ou `slug`.

Perguntas que conseguimos responder:

- Qual é a nota média da empresa nas avaliações aprovadas?
- Quantas avaliações aprovadas a empresa possui?
- Quantas avaliações são verificadas?
- Quantas avaliações receberam resposta da empresa?
- Como as notas estão distribuídas entre uma e cinco estrelas?
- A maioria das avaliações tem nota alta ou baixa?
- A empresa responde às avaliações publicadas?
- Existem dados suficientes para analisar a reputação da empresa?
- Qual é a proporção de avaliações verificadas?
- Qual é a taxa de resposta às avaliações?

Insights que podem ser calculados pelo consumidor da tool:

- `verified_rate = verified_total / total`.
- `reply_rate = replied_total / total`.
- Concentração de avaliações por faixa de nota.
- Sinalização de amostra pequena quando o total for insuficiente.

Somente avaliações aprovadas entram no resumo. Comentários privados, pendentes, rejeitados ou dados pessoais dos autores não são expostos.

### Solicitação de avaliações — `create_review_request`

Parâmetros disponíveis: `company_id` opcional e `message` opcional. Requer empresa autenticada ou admin.

Perguntas e ações atendidas:

- Gere meu link para solicitar uma avaliação.
- Crie uma mensagem de WhatsApp para pedir avaliação ao cliente.
- Qual é o formulário ativo de avaliações da minha empresa?
- Gere uma mensagem usando o texto padrão da plataforma.
- Personalize a mensagem de convite com o link correto.
- Crie o formulário padrão caso minha empresa ainda não possua um.
- Como posso convidar um cliente para avaliar minha empresa?
- Qual link posso colocar em um QR Code ou enviar por e-mail?

Resultado disponível:

- ID da empresa.
- ID do formulário real.
- URL pública com token do formulário.
- Mensagem pronta com a URL inserida.

A tool gera o link e a mensagem, mas não envia WhatsApp ou e-mail automaticamente neste MVP.

### Métricas do dashboard — `get_company_dashboard_metrics`

Parâmetro disponível: `company_id` opcional. Requer membro ativo da própria empresa ou admin.

Perguntas que conseguimos responder:

- Quantas visualizações meu perfil recebeu?
- Quantos cliques em CTAs foram registrados?
- Quantos cliques no WhatsApp foram registrados?
- Quantos leads minha empresa recebeu no total?
- Quantos leads minha empresa recebeu nos últimos 30 dias?
- Qual é a taxa de conversão estimada entre visualizações e leads?
- Quantas avaliações minha empresa possui?
- Quantas avaliações estão sem resposta?
- Qual é a nota média atual da empresa?
- Quantas alterações ou aprovações estão pendentes?
- Quantas campanhas ativas existem?
- Quais categorias da empresa estão ativas?
- Quantos leads recentes existem nas mesmas categorias?
- Quantos leads recentes existem na mesma região?
- Qual é a participação estimada da empresa nos leads da categoria?
- Quando os dados foram atualizados?
- Qual fonte de dados foi usada para montar as métricas?

Insights possíveis:

- Desempenho geral do perfil e dos CTAs.
- Oportunidades de melhorar conversão.
- Volume recente de demanda e avaliações.
- Comparação entre leads recebidos e potencial disponível na plataforma.

### Resumo de leads — `get_leads_summary`

Parâmetros disponíveis: `company_id` opcional e `days` entre 1 e 365. Requer membro ativo da própria empresa ou admin.

Perguntas que conseguimos responder:

- Quantos leads recebi nos últimos 7, 30, 90 ou 365 dias?
- Quantos leads existem por status?
- Quantos leads vieram de cada origem?
- Quais cidades mais geraram leads para minha empresa?
- Qual é o score médio dos leads?
- Quantos leads foram verificados, distribuídos ou chegaram à etapa de proposta?
- Qual canal ou fonte gerou mais leads?
- Minha demanda recente está concentrada em alguma cidade?
- Existe volume suficiente de leads no período solicitado?

Insights possíveis:

- Distribuição do funil por `wizard_status`.
- Origem predominante dos leads.
- Concentração geográfica da demanda.
- Qualidade média aproximada usando scores já calculados pela plataforma.

A resposta é agregada: nomes, e-mails, telefones, mensagens e demais dados pessoais dos leads não são retornados.

### Próximas ações recomendadas — `recommend_next_actions`

Parâmetro disponível: `company_id` opcional. Requer membro ativo da própria empresa ou admin.

Perguntas que conseguimos responder:

- O que devo fazer agora para melhorar meu perfil?
- Qual é a ação mais urgente no dashboard?
- Tenho avaliações aguardando resposta?
- Preciso solicitar mais avaliações?
- Existem leads recentes que merecem follow-up?
- Meu perfil está incompleto?
- Qual deve ser minha próxima ação comercial?
- Quais tarefas devo priorizar hoje?

Ações atualmente recomendadas:

- Responder avaliações pendentes.
- Solicitar novas avaliações quando a amostra ainda é pequena.
- Fazer follow-up dos leads recentes.
- Completar descrição ou logo do perfil.
- Monitorar conversão e reputação quando não há pendência prioritária.

Cada ação informa código, título, prioridade e, quando aplicável, valor atual. As recomendações são regras determinísticas baseadas nas métricas reais, não decisões geradas ou inventadas por IA.

### Snapshot de mercado — `get_market_snapshot`

Parâmetros disponíveis: `state` opcional e `days` entre 1 e 365. Requer admin.

Perguntas que conseguimos responder:

- Quantas empresas ativas existem na plataforma?
- Quantas empresas ativas são verificadas?
- Qual é a nota média das empresas cadastradas?
- Quais cidades possuem mais empresas cadastradas?
- Quantos produtos ativos existem?
- Quantas avaliações foram aprovadas no período?
- Quantos leads foram gerados no período?
- Como os leads estão distribuídos por vertical?
- Qual é o snapshot do mercado em determinado estado?
- Em quais cidades existe maior concentração de oferta cadastrada?
- Qual estado possui determinada quantidade de empresas ativas?
- Como está a relação agregada entre empresas, produtos, avaliações e leads?
- Existe baixa oferta cadastrada em determinada região?
- Quais verticais concentram mais demanda no período?

Insights possíveis:

- Oferta cadastrada versus demanda agregada por estado.
- Taxa agregada de empresas verificadas.
- Concentração geográfica de empresas.
- Atividade recente de avaliações e leads.
- Verticais com maior volume de oportunidades.

O snapshot retorna somente dados agregados e não expõe leads individuais, contatos, dados de usuários ou métricas privadas de uma empresa específica.

## Perguntas combinadas entre tools

O MobiVolt AI também pode encadear tools para responder perguntas mais completas:

- Encontre empresas verificadas em Florianópolis e compare as três mais bem avaliadas.
- Busque empresas de bateria, abra seus perfis e mostre diferenças de cobertura e reputação.
- Encontre produtos WEG e informe quais empresas estão diretamente vinculadas aos produtos encontrados.
- Compare duas empresas e complemente a análise com o resumo de avaliações de cada uma.
- Mostre minhas métricas, resuma meus leads e recomende as próximas ações.
- Gere um link de avaliação porque minha empresa ainda possui poucas avaliações.
- Mostre minha taxa de conversão atual e quais ações operacionais estão disponíveis.
- Encontre empresas para instalação residencial em uma cidade e informe quais dados de reputação estão disponíveis.

Cada etapa deve preservar a autorização da tool chamada. O encadeamento não amplia permissões: uma resposta pública não pode incorporar leads ou métricas privadas, e uma empresa nunca pode consultar dados privados de outra empresa.

## Perguntas que o MVP ainda não responde

Para evitar alucinação ou exposição indevida, o agente deve informar a limitação quando perguntado sobre:

- Previsão de faturamento, receita ou lucro das empresas.
- Dados pessoais, telefone, e-mail ou conteúdo individual dos leads.
- Métricas privadas de uma empresa concorrente.
- Documentos, CNPJ validado ou certificações não presentes no retorno público.
- Garantia de qualidade, idoneidade ou resultado futuro de uma empresa.
- Preço final de instalação quando não existe orçamento real.
- Estoque em tempo real quando o cadastro não estiver atualizado.
- Sentimento detalhado dos comentários, temas recorrentes ou resumo textual de reviews; o MVP atual retorna apenas agregados.
- Benchmark histórico por período para métricas do dashboard além dos agregados atualmente disponíveis.
- Envio automático de convite por WhatsApp, SMS ou e-mail.
- Criação, edição ou exclusão de leads, empresas, produtos ou avaliações.
- Ranking comercial secreto ou recomendação patrocinada não identificada.
- Dados de mercado externos ao banco do Avalia Solar.

## Regras para formular respostas

- Nunca inventar empresas, produtos, avaliações, métricas ou relações.
- Diferenciar “zero” de “não informado”.
- Informar quando a amostra de avaliações for pequena.
- Usar linguagem comparativa objetiva e evitar declarar vencedor absoluto.
- Não inferir que uma empresa atende uma localidade apenas porque está sediada nela.
- Não inferir que uma empresa trabalha com uma marca apenas pela existência de produtos sem vínculo direto.
- Não mostrar dados privados retornados por contexto anterior a usuários sem permissão.
- Não registrar nos logs os valores das perguntas, argumentos ou dados pessoais.
- Apresentar a data ou período das métricas quando disponível.
- Explicar qual dado está ausente quando não for possível concluir algo.

## Exemplo

```bash
curl -X POST http://localhost:3001/api/v1/mcp/tools/search_companies \
  -H "Content-Type: application/json" \
  -d '{"arguments":{"query":"energia solar","city":"Florianópolis","limit":5}}'
```

Resposta:

```json
{
  "ok": true,
  "tool": "search_companies",
  "data": { "companies": [], "count": 0 },
  "meta": { "request_id": "...", "execution_ms": 12 }
}
```

Os logs registram apenas tool, duração, request ID, usuário e nomes das chaves recebidas. Valores e dados pessoais não são registrados. Há rate limit por IP no Rack::Attack e por identidade/tool no controller.
