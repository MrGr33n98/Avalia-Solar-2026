# 12. TDD — Test-Driven Development

A implementação deve seguir o ciclo **RED → GREEN → REFACTOR**, com os testes escritos antes das modificações funcionais.

| Teste | Cenário | Resultado esperado |
|---|---|---|
| T01 | Um produto | Card não expande toda a seção |
| T02 | Dois produtos | Geometria uniforme |
| T03 | Três produtos | Três colunas quando houver espaço |
| T04 | 24 produtos | Grid e navegação estáveis |
| T05 | Nome extenso | Título completo acessível |
| T06 | Categoria extensa | Sem quebra estrutural |
| T07 | Sem imagem | Placeholder preserva geometria |
| T08 | URL de imagem inválida | Fallback funcional |
| T09 | Sem preço | Preço sob consulta |
| T10 | Preço elevado | Formatação BRL correta |
| T11 | Parcelamento indisponível | Nenhuma condição fictícia |
| T12 | Parcelamento confirmado | Valores reais apresentados |
| T13 | Empresa verificada | Badge correto |
| T14 | Empresa não verificada | Sem badge indevido |
| T15 | Uma avaliação | Singular correto |
| T16 | Múltiplas avaliações | Plural correto |
| T17 | Favoritar | Estado atualizado |
| T18 | Desfavoritar | Estado atualizado |
| T19 | Usuário não autenticado | Fluxo existente preservado |
| T20 | Ver detalhes | Navegação correta |
| T21 | Alterar filtro | Resultados corretos |
| T22 | Alterar ordenação | Ordem preservada |
| T23 | Aba Produtos | Variante compacta |
| T24 | Aba Todos | Variante compacta |
| T25 | Nenhum resultado | Empty state preservado |
| T26 | Carregamento | Skeleton sem salto visual |
| T27 | Teclado | Foco e navegação acessíveis |
| T28 | PWA 320 px | Sem overflow |
| T29 | Movimento reduzido | Animações respeitam preferência |
| T30 | Catálogo empresarial | Variante padrão preservada |

## Sequência
1. Encontrar runners e scripts existentes no package.json e workflows.
2. Registrar teste RED reproduzindo geometria/semântica incorreta; evitar testes frágeis baseados só em classes.
3. GREEN com mudança mínima isolada.
4. REFACTOR mantendo testes e contratos; executar regressões de consumidores.
5. Anexar saídas reais e código de retorno ao relatório. Não atualizar snapshots para mascarar falha.
