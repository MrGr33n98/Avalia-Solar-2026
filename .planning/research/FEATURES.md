# Panorama de Funcionalidades: Marketplace Solar

**Domínio:** Energia Renovável / Solar
**Pesquisado em:** 17/06/2026

## Funcionalidades Essenciais (Table Stakes)

Funcionalidades esperadas em qualquer marketplace de serviços.

| Funcionalidade | Por que esperada? | Complexidade | Notas |
|----------------|-------------------|--------------|-------|
| Busca e Filtros | Usuários precisam encontrar empresas locais. | Média | Implementado via `explore.tsx` com filtros de cidade/estado. |
| Perfil de Empresa | Detalhes, serviços e avaliações da empresa. | Baixa | `company/[id].tsx`. |
| Autenticação | Cadastro de consumidores e empresas. | Média | Gerenciado via Zustand e SecureStore. |
| Sistema de Leads | Solicitação de orçamento simples. | Baixa | `request-quote.tsx` e `lead.tsx`. |

## Diferenciais (Differentiators)

Funcionalidades que destacam o produto.

| Funcionalidade | Proposta de Valor | Complexidade | Notas |
|----------------|-------------------|--------------|-------|
| Chat P2P Real-time | Comunicação direta e rápida entre cliente e integrador. | Alta | Usa ActionCable em `p2p_chat/index.tsx`. |
| Dashboard B2B | Gestão de leads e métricas dentro do app para o dono da empresa. | Alta | `src/app/dashboard/` é completo (leads, planos, settings). |
| Calculadora Solar | Dimensionamento rápido e estimativa de ROI. | Média | `calculadora.tsx`. |
| Comparador de Produtos | Ajuda o usuário a escolher entre diferentes inversores/baterias. | Média | `compare.tsx`. |
| Scanner de QR Code | Facilita acesso rápido a perfis ou validação de instalação. | Baixa | `scanner.tsx`. |

## Anti-Funcionalidades

O que deve ser evitado ou feito de forma diferente.

| Anti-Funcionalidade | Por que evitar? | O que fazer em vez disso? |
|---------------------|-----------------|---------------------------|
| Processamento Pesado de Imagem | Consumo de bateria e processamento no mobile. | Usar redimensionamento via `expo-image-picker` antes do upload (já feito parcialmente). |
| Polling Infinito | Drena a bateria e gasta dados. | Migrar completamente para WebSockets/ActionCable (Unificação do Chat). |

## Dependências de Funcionalidades

```
Autenticação (Zustand Store) → Dashboard B2B (Requer role 'company')
Autenticação (SecureStore Token) → Chat P2P (Requer token para WS)
Seleção de Localização → Explore/Busca (Filtros padrão)
```

## Recomendação de MVP (Foco em QA)

Priorizar a validação de:
1. **Fluxo de Lead:** Do `request-quote` até a aparição no `dashboard/leads`.
2. **Real-time:** Estabilidade da conexão ActionCable em diferentes redes (4G vs Wi-Fi).
3. **Persistência Offline:** Verificar se o cache do Apollo funciona ao reabrir o app sem internet.

## Fontes
- Estrutura de diretórios `src/app`.
- Código fonte do `p2p_chat/index.tsx`.
- Requisitos em `.planning/REQUIREMENTS.md`.
