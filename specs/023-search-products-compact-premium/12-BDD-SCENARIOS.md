## 12.1. BDD — Behavior-Driven Development

```gherkin
Feature: Compact product discovery

  Scenario: Buscar uma marca com apenas um produto
    Given que o usuário pesquisou "goodwe"
    And existe apenas um produto correspondente
    When a seção de produtos é renderizada
    Then o card deve manter sua geometria compacta
    And não deve ocupar toda a largura disponível
    And todas as informações válidas devem ser preservadas

  Scenario: Buscar produtos de qualquer marca
    Given que existem múltiplos produtos correspondentes
    When os resultados são apresentados
    Then o grid deve utilizar o espaço disponível
    And todos os cards devem respeitar os tokens de densidade

  Scenario: Produto sem condição de parcelamento
    Given que o produto possui preço
    But não possui parcelamento confirmado
    When o card é renderizado
    Then o preço deve ser apresentado
    And nenhuma condição comercial deve ser presumida

  Scenario: Componente usado fora da busca
    Given que o ProductCardEnhanced é usado no catálogo
    When a variante compacta não é solicitada
    Then a geometria padrão deve ser preservada
```
