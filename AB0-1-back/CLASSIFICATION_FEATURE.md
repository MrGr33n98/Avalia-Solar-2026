# Funcionalidade de Classificação (Ranking)

Esta documentação descreve a implementação da funcionalidade de classificação de empresas na plataforma AB0-1.

## 1. Análise da Estrutura Atual
A plataforma necessitava de uma forma de listar empresas ordenadas por sua reputação (média de avaliações e volume de feedback). Anteriormente, a listagem era feita apenas por data de criação ou sem uma ordem definida clara que privilegiasse a qualidade.

## 2. Lógica de Classificação
A lógica de classificação foi implementada no `CompaniesController` e utiliza dois critérios principais em ordem de prioridade:
1. **Média de Avaliações (`rating_avg`)**: Ordem decrescente.
2. **Quantidade de Avaliações (`rating_count`)**: Ordem decrescente (desempate).
3. **Data de Criação (`created_at`)**: Ordem decrescente (desempate final).

### Implementação no Backend
O parâmetro `sort` foi adicionado à API de empresas:
- `sort=rating` ou `sort=rating_avg`: Ativa a classificação por ranking.
- Se o parâmetro `sort` for omitido ou inválido, o sistema agora utiliza o ranking como padrão para garantir que as melhores empresas apareçam primeiro.

## 3. Validação e Segurança
- Foi adicionada uma lista branca (`valid_sorts`) para evitar injeção de SQL ou ordenação por campos sensíveis/inexistentes.
- Tratamento de parâmetros inválidos: O sistema faz fallback para a ordenação padrão em vez de retornar erro 400 ou 500.

## 4. Exemplos de Requisição e Resposta

### Requisição
**GET** `/api/v1/companies?sort=rating&limit=3`

### Resposta Esperada (JSON)
```json
[
  {
    "id": 10,
    "name": "WEG Solar",
    "rating_avg": 5.0,
    "rating_count": 12,
    "status": "active",
    "slug": "weg-solar"
  },
  {
    "id": 5,
    "name": "SolarTech",
    "rating_avg": 4.8,
    "rating_count": 45,
    "status": "active",
    "slug": "solar-tech"
  },
  {
    "id": 2,
    "name": "EcoEnergy",
    "rating_avg": 4.8,
    "rating_count": 15,
    "status": "active",
    "slug": "eco-energy"
  }
]
```

## 5. Testes de Integração
Foi criado o arquivo `test/controllers/api/v1/classification_test.rb` que valida:
- Ordenação correta por `rating_avg`.
- Desempate por `rating_count`.
- Fallback seguro para parâmetros de ordenação inválidos.
- Comportamento padrão (ranking) quando nenhum parâmetro é passado.

## 6. Frontend
A funcionalidade é consumida na nova rota `/rating-stars`, que exibe o Top 10 das empresas melhor classificadas na plataforma.

---
*Data da Implementação: 01 de Fevereiro de 2026*
