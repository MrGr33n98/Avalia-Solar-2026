# 8. PRD — Product Requirements Document

| Requisito | Descrição | Critério de aceite |
|---|---|---|
| RF-01 | Compactar todos os cards de produtos da busca | Independente de marca ou categoria |
| RF-02 | Preservar informações válidas | Nenhuma informação comercial comprovada removida |
| RF-03 | Preservar favoritos | Adicionar e remover normalmente |
| RF-04 | Preservar filtros | Categoria, marca, preço, região e verificação |
| RF-05 | Preservar navegação | Mesma URL de destino do produto |
| RF-06 | Grid responsivo | Adaptar à largura útil |
| RF-07 | Exibir imagens integralmente | Sem deformação ou cortes indevidos |
| RF-08 | Tratar ausência de imagem | Placeholder na mesma geometria |
| RF-09 | Tratar ausência de preço | Preço sob consulta |
| RF-10 | Preservar ordenação | Ranking atual permanece intacto |
| RF-11 | Preservar abas | Todos e Produtos |
| RF-12 | Identificar origem da reputação | Não atribuir nota da empresa ao produto |
| RF-13 | Parcelamento confiável | Somente condições comerciais válidas |
| RF-14 | Compatibilidade PWA | Sem overflow horizontal |
| RF-15 | Preservar analytics | Sem perda ou duplicação de eventos existentes |
| RF-16 | Isolar variante compacta | Demais superfícies inalteradas |
| RF-17 | Acessibilidade | Teclado, leitores de tela e touch |
| RF-18 | Suportar nomes extensos | Conteúdo completo acessível |

## Escopo e não objetivos
Em escopo: /search, abas Todos e Produtos, todas as consultas e filtros, desktop e PWA. Fora de escopo: redesign de outras seções, ranking, contratos de API e backend, pagamentos e alterações globais. Se for indispensável mudar um contrato para exibir parcelamento real, documentar em ADR e separar aprovação; ausência de dados não autoriza inventar condições.
