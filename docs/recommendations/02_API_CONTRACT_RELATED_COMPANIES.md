# Contrato de API — Recomendações e Empresas Relacionadas

**Endpoint:** `GET /api/v1/recommendations`  
**Controlador:** `Api::V1::RecommendationsController#index`  
**Serviço Principal:** `Recommendation::Engine`  
**Serializador:** `RecommendationSerializer`  
**Autenticação:** Pública (suporta tokens opcionais para personalização)  
**Cache:** `Cache-Control: public, max-age=120, stale-while-revalidate=300`  

---

## 1. Parâmetros de Requisição (Query String)

| Parâmetro | Tipo | Obrigatório | Descrição |
|:---|:---|:---|:---|
| `context_company_id` | Integer | Não (Recomendado para Company Page) | ID da empresa sendo visualizada. A engine herda automaticamente categoria, segmento e localização de sede caso não explicitados. |
| `exclude_company_id` | Integer | Não (Recomendado para Company Page) | ID da empresa a ser excluída estritamente dos resultados para evitar autorecomendação. |
| `category_id` | Integer | Não | Filtra empresas elegíveis pertencentes à categoria especificada. |
| `state` | String (2 chars) | Não | UF canônica (ex.: `SC`, `SP`). Prioriza cobertura territorial real do comprador. |
| `city` | String | Não | Cidade canônica (ex.: `Florianópolis`). |
| `limit` | Integer | Não (Default: 6, Max: 20) | Quantidade máxima de empresas recomendadas retornadas. |
| `visitor_id` | String | Não | Identificador anônimo de sessão para diversificação e experimentos A/B. |

---

## 2. Exemplo de Requisição (Frontend -> Backend)

```http
GET /api/v1/recommendations?context_company_id=42&exclude_company_id=42&category_id=3&state=SC&city=Florianopolis&limit=6 HTTP/1.1
Host: api.avaliasolar.com.br
Accept: application/json
```

---

## 3. Exemplo de Resposta de Sucesso (HTTP 200 OK)

```json
{
  "meta": {
    "context": {
      "city": "Florianópolis",
      "state": "SC",
      "category_id": 3,
      "segment": "integrador_solar",
      "visitor_id": "anon-session-abc",
      "location_source": "buyer_explicit",
      "context_company_id": 42,
      "exclude_company_id": 42
    },
    "score_version": "v1.0",
    "total_eligible": 14,
    "returned": 5
  },
  "placements": {
    "sponsored": [],
    "pinned": []
  },
  "data": [
    {
      "id": 105,
      "name": "Solar Sul Engenharia",
      "slug": "solar-sul-engenharia",
      "logo_url": "https://cdn.avaliasolar.com.br/logos/solar-sul.webp",
      "segment": "integrador_solar",
      "comparable_group": "integrador_solar_sc",
      "verified": true,
      "featured": true,
      "sponsored": false,
      "city": "São José",
      "state": "SC",
      "rating_avg": 4.9,
      "rating_count": 87,
      "response_time_sla": "15m",
      "delivered_projects_score": 450,
      "recommendation_reason": {
        "code": "serves_buyer_city",
        "label": "Atende sua cidade"
      },
      "coverage": {
        "type": "regional",
        "label": "Grande Florianópolis e Litoral SC"
      },
      "rating": {
        "average": 4.9,
        "count": 87,
        "label": "Excelente (87 avaliações)"
      },
      "response_time": {
        "value": "15m",
        "label": "Atende em até 15 minutos"
      },
      "projects": {
        "count": 450,
        "label": "Mais de 450 instalações homologadas"
      },
      "primary_cta": {
        "type": "quote",
        "label": "Solicitar Orçamento",
        "action": "open_lead_modal",
        "url": null
      }
    }
  ]
}
```

---

## 4. Resposta Vazia Honesta (HTTP 200 OK — Sem Concorrentes)

Quando nenhuma empresa cumpre os critérios rigorosos de elegibilidade (ativas, moderadas, com cobertura comprovada para a região e pertencentes à mesma categoria), o backend retorna `data: []`:

```json
{
  "meta": {
    "context": {
      "city": "Curitibanos",
      "state": "SC",
      "category_id": 3,
      "segment": "integrador_solar",
      "visitor_id": "anon-session-abc",
      "location_source": "buyer_explicit",
      "context_company_id": 42,
      "exclude_company_id": 42
    },
    "score_version": "v1.0",
    "total_eligible": 0,
    "returned": 0
  },
  "placements": {
    "sponsored": [],
    "pinned": []
  },
  "data": []
}
```
*Comportamento na UI:* A interface renderiza o modo `empty`, informando de maneira clara e transparente que não foram encontradas alternativas homologadas que atendam àquela localização específica.

---

## 5. Respostas de Erro

### Erro de Validação de Parâmetros (HTTP 400 Bad Request)
```json
{
  "error": "Bad Request",
  "message": "O parâmetro limit deve ser um número inteiro positivo entre 1 e 20."
}
```

### Indisponibilidade de Serviço / Falha no Banco (HTTP 500 / 503)
```json
{
  "code": "RECOMMENDATIONS_UNAVAILABLE",
  "message": "Não foi possível carregar as recomendações no momento."
}
```
*Comportamento na UI:* A interface captura a exceção, ativa o modo `error`, e renderiza um card acessível com botão **"Tentar novamente"**, sem nunca fingir que o perfil possui exclusividade nem silenciar o erro como lista vazia.
