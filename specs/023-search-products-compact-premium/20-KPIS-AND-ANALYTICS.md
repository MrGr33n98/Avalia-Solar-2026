# 17. KPIs de sucesso da experiência

Além dos critérios técnicos, a alteração deve ser avaliada pela sua contribuição à experiência de descoberta de produtos.

| KPI | Meta proposta |
|---|---:|
| Redução da altura dos cards | 35–50% |
| Capacidade de produtos por linha na tela apresentada | +50% |
| Redução de scroll para acessar avaliações | ≥30% no cenário de referência |
| CTR em Ver detalhes | +15% |
| Interações com favoritos | +10% |
| Taxa de abandono da busca | −10% |
| Tempo até primeira interação com produto | −20% |
| Regressões funcionais | 0 |
| Informações comerciais fictícias | 0 |

As metas comportamentais são hipóteses para validação posterior por analytics e, idealmente, experimentação controlada.

---

## 18. Resultado esperado

O Avalia Solar deve sair de uma apresentação de produtos com estética de vitrine convencional para uma experiência de **Product Discovery Enterprise**, com alta densidade informacional, leitura rápida e componentes consistentes.

O mesmo conceito poderá posteriormente ser aplicado ao catálogo `/products`, às Brand Pages e aos componentes de descoberta de produtos, utilizando a variante compacta de forma controlada.

**Status desta auditoria:** diagnóstico visual realizado, componentes localizados, causas raiz estruturais confirmadas no código e especificação proposta. Nenhum arquivo do repositório foi alterado. Não executei medições de runtime, Lighthouse ou testes automatizados nesta etapa, nem confirmei se o commit consultado corresponde exatamente ao deploy atual de produção. Essas validações integram a Wave 0.

## Medição
Registrar exposição elegível à seção e preservar eventos existentes. Comparar períodos/coortes equivalentes ou experimento controlado; CTR = cliques em detalhes / impressões elegíveis; favoritos = interações / impressões; abandono e tempo até ação precisam de definição e denominador estáveis. Não atribuir causalidade a variação de tráfego sem controle.
