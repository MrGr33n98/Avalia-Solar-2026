# Lead Scoring Contract

- `intent_score`: intenção declarada e sinais de ação do visitante.
- `fit_score`: aderência de perfil/contexto, como vertical, localização e parâmetros do projeto.
- `lead_score`: composição operacional `intent_score + fit_score`, limitada conforme regras do serviço.
- `icp_match`: não calculado por padrão. Só existe quando empresa possui ICP configurado e comparação explícita foi executada.

`algorithm_version = lead_scoring_v2`. `explicit_quote` separa orçamento explícito de inferência por engajamento. Terceira mensagem isolada não cria lead forte.
