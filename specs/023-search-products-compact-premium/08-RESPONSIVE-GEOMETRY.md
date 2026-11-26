# 7. Layout responsivo — Web App e PWA

O número de colunas deve ser determinado pela largura útil da seção, e não simplesmente pela largura do monitor.

| Largura útil do container | Colunas | Comportamento |
|---|---:|---|
| Até 491 px | 1 | Card compacto |
| 492–743 px | 2 | Grid compacto |
| 744–995 px | 3 | Grid premium |
| 996–1.247 px | 4 | Grid enterprise |
| Acima de 1.248 px | Até 5 | Respeitar limite visual |

### Na sua tela atual

A área de resultados possui aproximadamente 840 px de largura na captura.

**Antes:**

```text
┌────────────────┐ ┌────────────────┐
│                │ │                │
│    Produto     │ │ Espaço vazio   │
│                │ │                │
│                │ │                │
│                │ │                │
│                │ │                │
└────────────────┘ └────────────────┘
```

**Depois:**

```text
┌────────────┐ ┌────────────┐ ┌────────────┐
│  Produto   │ │  Produto   │ │  Produto   │
│            │ │            │ │            │
│  Dados     │ │  Dados     │ │  Dados     │
│  Preço     │ │  Preço     │ │  Preço     │
└────────────┘ └────────────┘ └────────────┘
```

Quando houver apenas um resultado, o card permanecerá com a geometria equivalente à de uma coluna normal. Não serão criados cards vazios nem produtos fictícios para preencher a seção.

## Regra de implementação complementar
A expressão auto-fill com 1fr é apenas ponto de partida: implementar limite efetivo de cinco colunas e max-width ou tracks limitados para impedir expansão em containers amplos. Preferir largura de 240–280 px em containers multicoluna; em mobile permitir largura adaptada ao container. Não forçar altura fixa do card: textos e condições válidas podem ampliar a altura. Usar altura-alvo de mídia 136 px, faixa 128–152 px; cards de uma mesma linha podem se alinhar sem reservar espaço desnecessário. Validar limites 491/492, 743/744, 995/996 e 1247/1248 px de container; sem dependência de contagem de resultados.
