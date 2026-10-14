# 05 — Design System & UI/UX Guidelines

## 1. Princípios Visuais Originais do Avalia Solar
- **Identidade Própria:** Clean Swiss SaaS empresarial. Predomínio de superfícies brancas, bordas delicadas (`border-slate-200`), texto em Slate Navy (`text-slate-900` / `text-slate-950`), ações em Solar Blue (`bg-blue-600`), e detalhes de marca em Solar Yellow (`#F6E85A`).
- **Zero Verde Dominante:** Diferenciação visual estrita em relação ao 77SOL e concorrentes. O verde é restrito a badges de status de sucesso (`sent`, `accepted`).
- **Política de Ícones Enxuta:** Uso estrito de ícones contextuais e funcionais (Lucide Icons), sem poluição visual ou decorações desnecessárias em cada célula de tabela.
- **Tipografia:** Escala tipográfica legível (13–15px no desktop, 14px+ no mobile), garantindo legibilidade WCAG sem textos microscópicos de 9-10px.

## 2. Layout Adaptativo por Breakpoint

| Viewport | Estrutura de Layout | Comportamento do Chat e Studio |
| :--- | :--- | :--- |
| **Desktop Largo (≥ 1280px)** | 3 Colunas simultâneas: Lista (310px) + Detalhes/Studio (Flex) + Conversa P2P (340px) | Chat persistente visível com composer ativo sem sobreposição. |
| **Desktop Médio (1024px – 1279px)** | 2 Colunas: Lista (280px) + Detalhes/Studio (Flex) | Conversa acessível por Drawer lateral controlado sem sair da proposta. |
| **Tablet / Mobile (< 1024px, PWA)** | 1 Área de Trabalho por vez com barra de navegação progressiva | Lista → Detalhes → Conversa → Edição. Teclado virtual não obstrui botão Enviar. |

## 3. Os 5 Modelos PDF Originais do Avalia Solar
1. **Moderno Solar (`moderno`):** Layout assimétrico, cabeçalho dinâmico com logotipo em destaque, blocos em cartões suaves.
2. **Corporativo Clássico (`classico`):** Estrutura formal corporativa, bordas refinadas, divisão clara de responsabilidades técnicas.
3. **Clean Minimalista (`clean`):** Tipografia nítida suíça, máximo espaço em branco, foco em síntese e números.
4. **Executivo Premium (`premium`):** Design nobre com cartões elevados, destaque para payback e selos de garantia.
5. **Credenciais & Engenharia (`institucional`):** Ênfase em qualificações da equipe técnica, certificações e portfólio de obras reais.
